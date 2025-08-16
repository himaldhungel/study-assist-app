import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Users, Calendar, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateBatchForm } from "@/components/forms/CreateBatchForm";
import { AddStudentToBatchForm } from "@/components/forms/AddStudentToBatchForm";
import { BatchDetailsDialog } from "@/components/dialogs/BatchDetailsDialog";
import { supabase } from "@/integrations/supabase/client";

interface Batch {
  id: string;
  name: string;
  class_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

const Classes = () => {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("language_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching batches",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClassTypeColor = (classType: string) => {
    const colors: Record<string, string> = {
      IELTS: "bg-blue-100 text-blue-800",
      PTE: "bg-green-100 text-green-800", 
      TOEFL: "bg-purple-100 text-purple-800",
      Japanese: "bg-red-100 text-red-800",
      Korean: "bg-yellow-100 text-yellow-800",
      French: "bg-pink-100 text-pink-800",
      German: "bg-orange-100 text-orange-800",
    };
    return colors[classType] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Language Classes</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Language Classes</h1>
          <p className="text-muted-foreground">Manage batches and student enrollments</p>
        </div>
        <CreateBatchForm onBatchCreated={fetchBatches} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {batches.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {batches.filter(b => new Date(b.start_date) <= new Date() && new Date(b.end_date) >= new Date()).length}
            </div>
            <p className="text-sm text-muted-foreground">Active Batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-info">
              {batches.filter(b => new Date(b.start_date) > new Date()).length}
            </div>
            <p className="text-sm text-muted-foreground">Upcoming Batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Batches List */}
      <div className="grid gap-4">
        {batches.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">No Language Batches Yet</CardTitle>
              <CardDescription className="text-lg mb-6 max-w-2xl mx-auto">
                Create your first language class batch to start managing students and track their progress.
              </CardDescription>
              <CreateBatchForm 
                onBatchCreated={fetchBatches}
                trigger={
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Batch
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          batches.map((batch) => {
            const startDate = new Date(batch.start_date);
            const endDate = new Date(batch.end_date);
            const today = new Date();
            
            let status = "upcoming";
            if (today >= startDate && today <= endDate) {
              status = "active";
            } else if (today > endDate) {
              status = "completed";
            }

            return (
              <Card key={batch.id} className="hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <CardTitle className="text-lg">{batch.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassTypeColor(batch.class_type)}`}>
                          {batch.class_type}
                        </span>
                        <span className="text-xs">
                          Created {new Date(batch.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}>
                      {status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Start: {startDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>End: {endDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <AddStudentToBatchForm 
                      batchId={batch.id}
                      batchName={batch.name}
                      onStudentAdded={fetchBatches}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          Add Students
                        </Button>
                      }
                    />
                    <BatchDetailsDialog 
                      batch={batch}
                      trigger={
                        <Button variant="outline" size="sm">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Classes;