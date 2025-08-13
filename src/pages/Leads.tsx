import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search, Phone, Mail, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddLeadForm } from "@/components/forms/AddLeadForm";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  purpose: "application_process" | "language_class";
  status: "new" | "in_progress" | "converted";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "info";
      case "in_progress":
        return "warning";
      case "converted":
        return "success";
      default:
        return "secondary";
    }
  };

  const getPurposeLabel = (purpose: string) => {
    return purpose === "application_process" ? "Application Process" : "Language Class";
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Leads Management</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground">Track and manage potential students</p>
        </div>
        <AddLeadForm onLeadAdded={fetchLeads} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-info">
              {leads.filter(l => l.status === "new").length}
            </div>
            <p className="text-sm text-muted-foreground">New Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {leads.filter(l => l.status === "in_progress").length}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {leads.filter(l => l.status === "converted").length}
            </div>
            <p className="text-sm text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No leads found matching your criteria.</p>
              <AddLeadForm 
                onLeadAdded={fetchLeads}
                trigger={
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Lead
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-medium transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span>{getPurposeLabel(lead.purpose)}</span>
                      <span className="text-xs">
                        Created {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(lead.status) as any}>
                    {lead.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                </div>
                {lead.notes && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>Notes:</span>
                    </div>
                    <p className="text-sm bg-muted p-3 rounded">{lead.notes}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Add Follow-up",
                      description: `Follow-up for ${lead.name} will be added.`,
                    })}
                  >
                    Add Follow-up
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Edit Lead",
                      description: `Edit form for ${lead.name} will open.`,
                    })}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Convert Lead",
                      description: `${lead.name} will be converted to student.`,
                    })}
                  >
                    Convert
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Leads;