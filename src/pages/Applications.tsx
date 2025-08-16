import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Upload, Globe, CheckCircle, User, Mail, Phone, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddStudentForm } from "@/components/forms/AddStudentForm";
import { UploadDocumentsForm } from "@/components/forms/UploadDocumentsForm";
import { TrackApplicationForm } from "@/components/forms/TrackApplicationForm";
import { UpdateStatusForm } from "@/components/forms/UpdateStatusForm";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  status: string;
  created_at: string;
}

const Applications = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("application_students")
        .select("*")
        .order("created_at", { ascending: false });

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      documents_pending: "bg-yellow-100 text-yellow-800",
      documents_submitted: "bg-blue-100 text-blue-800",
      application_sent: "bg-purple-100 text-purple-800",
      offer_received: "bg-green-100 text-green-800",
      visa_applied: "bg-orange-100 text-orange-800",
      completed: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Application Process</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Application Process</h1>
          <p className="text-muted-foreground">Manage university applications and documents</p>
        </div>
        <AddStudentForm onStudentAdded={fetchStudents} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {students.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {students.filter(s => s.status === "documents_pending").length}
            </div>
            <p className="text-sm text-muted-foreground">Documents Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-info">
              {students.filter(s => ["documents_submitted", "application_sent"].includes(s.status)).length}
            </div>
            <p className="text-sm text-muted-foreground">In Process</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {students.filter(s => s.status === "completed").length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <div className="grid gap-4">
        {students.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">No Students Yet</CardTitle>
              <CardDescription className="text-lg mb-6 max-w-2xl mx-auto">
                Add your first student to start managing university applications and documents.
              </CardDescription>
              <AddStudentForm 
                onStudentAdded={fetchStudents}
                trigger={
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Student
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          students.map((student) => (
            <Card key={student.id} className="hover:shadow-medium transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-lg">{student.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="text-xs">
                        Added {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(student.status)}>
                    {getStatusLabel(student.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{student.email}</span>
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{student.address}</span>
                    </div>
                  )}
                  {student.date_of_birth && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {new Date(student.date_of_birth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <UploadDocumentsForm 
                    studentId={student.id}
                    studentName={student.full_name}
                    onDocumentUploaded={fetchStudents}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Documents
                      </Button>
                    }
                  />
                  <TrackApplicationForm 
                    studentId={student.id}
                    studentName={student.full_name}
                    onApplicationAdded={fetchStudents}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Globe className="mr-2 h-4 w-4" />
                        Track Applications
                      </Button>
                    }
                  />
                  <UpdateStatusForm 
                    studentId={student.id}
                    studentName={student.full_name}
                    currentStatus={student.status}
                    onStatusUpdated={fetchStudents}
                    trigger={
                      <Button variant="outline" size="sm">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Status
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Applications;