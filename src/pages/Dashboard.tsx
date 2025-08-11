import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, FileText, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import dashboardHero from "@/assets/dashboard-hero.jpg";

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeBatches: number;
  totalStudents: number;
  applicationsPending: number;
  applicationsCompleted: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    activeBatches: 0,
    totalStudents: 0,
    applicationsPending: 0,
    applicationsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch leads stats
        const { data: leads } = await supabase
          .from("leads")
          .select("status");
        
        const totalLeads = leads?.length || 0;
        const newLeads = leads?.filter(lead => lead.status === "new").length || 0;

        // Fetch language classes stats
        const { data: batches } = await supabase
          .from("language_batches")
          .select("id, end_date");
        
        const activeBatches = batches?.filter(batch => 
          new Date(batch.end_date) > new Date()
        ).length || 0;

        // Fetch batch students count
        const { data: batchStudents } = await supabase
          .from("batch_students")
          .select("id");
        
        const totalStudents = batchStudents?.length || 0;

        // Fetch application students stats
        const { data: applicationStudents } = await supabase
          .from("application_students")
          .select("status");
        
        const applicationsPending = applicationStudents?.filter(student => 
          student.status !== "completed"
        ).length || 0;
        
        const applicationsCompleted = applicationStudents?.filter(student => 
          student.status === "completed"
        ).length || 0;

        setStats({
          totalLeads,
          newLeads,
          activeBatches,
          totalStudents,
          applicationsPending,
          applicationsCompleted,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      subtitle: `${stats.newLeads} new leads`,
      icon: Users,
      color: "info",
      href: "/leads",
    },
    {
      title: "Active Batches",
      value: stats.activeBatches,
      subtitle: `${stats.totalStudents} total students`,
      icon: BookOpen,
      color: "success",
      href: "/classes",
    },
    {
      title: "Applications",
      value: stats.applicationsPending,
      subtitle: `${stats.applicationsCompleted} completed`,
      icon: FileText,
      color: "warning",
      href: "/applications",
    },
    {
      title: "Success Rate",
      value: stats.applicationsCompleted > 0 ? 
        Math.round((stats.applicationsCompleted / (stats.applicationsPending + stats.applicationsCompleted)) * 100) : 0,
      subtitle: "Applications completed",
      icon: TrendingUp,
      color: "primary",
      href: "/applications",
      isPercentage: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-hero p-8 text-primary-foreground">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${dashboardHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'User'}!
          </h1>
          <p className="text-primary-foreground/90 text-lg mb-6">
            Manage your educational consultancy with ease and efficiency.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate("/leads")}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Lead
            </Button>
            <Button variant="ghost" className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10">
              View Reports
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card 
            key={index} 
            className="hover:shadow-medium transition-shadow cursor-pointer group"
            onClick={() => navigate(card.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 text-${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 group-hover:text-primary transition-colors">
                {card.value}{card.isPercentage ? "%" : ""}
              </div>
              <p className="text-sm text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              Leads Management
            </CardTitle>
            <CardDescription>
              Manage and track potential students and their interests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">New leads today</span>
              <Badge variant="secondary">{stats.newLeads}</Badge>
            </div>
            <Button onClick={() => navigate("/leads")} className="w-full">
              Manage Leads
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-success" />
              Language Classes
            </CardTitle>
            <CardDescription>
              Organize batches and manage student enrollments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active batches</span>
              <Badge variant="secondary">{stats.activeBatches}</Badge>
            </div>
            <Button onClick={() => navigate("/classes")} className="w-full">
              Manage Classes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              Applications
            </CardTitle>
            <CardDescription>
              Track university applications and document submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending applications</span>
              <Badge variant="secondary">{stats.applicationsPending}</Badge>
            </div>
            <Button onClick={() => navigate("/applications")} className="w-full">
              Manage Applications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;