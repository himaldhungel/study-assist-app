import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Calendar, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BatchStudent {
  id: string;
  student_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  enrollment_date: string;
  created_at: string;
}

interface Batch {
  id: string;
  name: string;
  class_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface BatchDetailsDialogProps {
  batch: Batch;
  trigger?: React.ReactNode;
}

export function BatchDetailsDialog({ batch, trigger }: BatchDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBatchStudents();
    }
  }, [open]);

  const fetchBatchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("batch_students")
        .select("*")
        .eq("batch_id", batch.id)
        .order("enrollment_date", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching students",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const startDate = new Date(batch.start_date);
    const endDate = new Date(batch.end_date);
    const today = new Date();
    
    if (today >= startDate && today <= endDate) {
      return <Badge variant="default">ACTIVE</Badge>;
    } else if (today > endDate) {
      return <Badge variant="outline">COMPLETED</Badge>;
    } else {
      return <Badge variant="secondary">UPCOMING</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <GraduationCap className="mr-2 h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {batch.name}
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the batch and enrolled students.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Batch Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Batch Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Class Type</p>
                  <p className="text-sm">{batch.class_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-sm">{students.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-sm">{new Date(batch.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-sm">{new Date(batch.end_date).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrolled Students ({students.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students enrolled in this batch yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{student.student_name}</h4>
                        <div className="text-xs text-muted-foreground">
                          Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {student.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{student.contact_email}</span>
                          </div>
                        )}
                        {student.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{student.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}