import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Eye, Edit, Plus, Download, FileText, Calendar, University, User, Phone, Mail, MapPin, CreditCard, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types
interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  passport_number: string;
  status: 'documents_pending' | 'documents_submitted' | 'application_sent' | 'offer_received' | 'visa_applied' | 'completed';
  created_at: string;
}

interface University {
  id: string;
  university_name: string;
  course_name: string;
  application_date: string;
  response_date: string;
  status: string;
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  created_at: string;
}
// Schemas
const studentSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  passport_number: z.string().optional(),
  status: z.enum(['documents_pending', 'documents_submitted', 'application_sent', 'offer_received', 'visa_applied', 'completed']),
});

const universitySchema = z.object({
  university_name: z.string().min(1, "University name is required"),
  course_name: z.string().min(1, "Course name is required"),
  application_date: z.string().optional(),
  response_date: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

interface StudentApplicationDetailsProps {
  studentId: string;
  trigger?: React.ReactNode;
  onUpdate?: () => void;
}

export function StudentApplicationDetails({ studentId, trigger, onUpdate }: StudentApplicationDetailsProps) {
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addingUniversity, setAddingUniversity] = useState(false);
  const { toast } = useToast();

  // Forms
  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
  });

  const universityForm = useForm<z.infer<typeof universitySchema>>({
    resolver: zodResolver(universitySchema),
  });

  // Load student data
  const loadStudentData = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      // Load student details
      const { data: studentData, error: studentError } = await supabase
        .from('application_students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);
      studentForm.reset({
        ...studentData,
        email: studentData.email || "",
        phone: studentData.phone || "",
        address: studentData.address || "",
        date_of_birth: studentData.date_of_birth || "",
        passport_number: studentData.passport_number || "",
      });

      // Load universities
      const { data: universitiesData, error: universitiesError } = await supabase
        .from('universities')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (universitiesError) throw universitiesError;
      setUniversities(universitiesData || []);

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update student details
  const updateStudent = async (data: z.infer<typeof studentSchema>) => {
    try {
      const { error } = await supabase
        .from('application_students')
        .update({
          ...data,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          date_of_birth: data.date_of_birth || null,
          passport_number: data.passport_number || null,
        })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student details updated successfully!",
      });

      setEditMode(false);
      loadStudentData();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add university
  const addUniversity = async (data: z.infer<typeof universitySchema>) => {
    try {
      const { error } = await supabase
        .from('universities')
        .insert({
          ...data,
          student_id: studentId,
          application_date: data.application_date || null,
          response_date: data.response_date || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "University application added successfully!",
      });

      universityForm.reset();
      setAddingUniversity(false);
      loadStudentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete university
  const deleteUniversity = async (universityId: string) => {
    if (!confirm("Are you sure you want to delete this university application?")) return;

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', universityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "University application deleted successfully!",
      });

      loadStudentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Download document
  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusColors = {
      'documents_pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'documents_submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'application_sent': 'bg-purple-100 text-purple-800 border-purple-200',
      'offer_received': 'bg-green-100 text-green-800 border-green-200',
      'visa_applied': 'bg-orange-100 text-orange-800 border-orange-200',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  useEffect(() => {
    if (open) {
      loadStudentData();
    }
  }, [open, studentId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Application Details</DialogTitle>
              <DialogDescription className="text-base">
                {student?.full_name} - Complete application overview and management
              </DialogDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className={`${getStatusBadge(student?.status || '')} text-xs`}>
                {student?.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              {!editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading application details...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="universities" className="flex items-center gap-2">
                <University className="h-4 w-4" />
                Universities ({universities.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                  <CardDescription>
                    Personal details and application status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <Form {...studentForm}>
                      <form onSubmit={studentForm.handleSubmit(updateStudent)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={studentForm.control}
                            name="full_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentForm.control}
                            name="date_of_birth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentForm.control}
                            name="passport_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Passport Number</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Application Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="documents_pending">Documents Pending</SelectItem>
                                    <SelectItem value="documents_submitted">Documents Submitted</SelectItem>
                                    <SelectItem value="application_sent">Application Sent</SelectItem>
                                    <SelectItem value="offer_received">Offer Received</SelectItem>
                                    <SelectItem value="visa_applied">Visa Applied</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={studentForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea {...field} className="resize-none" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditMode(false)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Full Name</p>
                          <p className="text-muted-foreground">{student?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-muted-foreground">{student?.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-muted-foreground">{student?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Date of Birth</p>
                          <p className="text-muted-foreground">
                            {student?.date_of_birth ? format(new Date(student.date_of_birth), 'PPP') : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Passport Number</p>
                          <p className="text-muted-foreground">{student?.passport_number || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Address</p>
                          <p className="text-muted-foreground">{student?.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="universities" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">University Applications</h3>
                  <p className="text-sm text-muted-foreground">Track applications to different universities</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingUniversity(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add University
                </Button>
              </div>

              {addingUniversity && (
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle>Add University Application</CardTitle>
                    <CardDescription>Enter details for a new university application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...universityForm}>
                      <form onSubmit={universityForm.handleSubmit(addUniversity)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={universityForm.control}
                            name="university_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>University Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Harvard University" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={universityForm.control}
                            name="course_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Course Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Master of Science in Computer Science" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={universityForm.control}
                            name="application_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Application Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={universityForm.control}
                            name="response_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Response Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={universityForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Application Status *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Applied">Applied</SelectItem>
                                  <SelectItem value="Under Review">Under Review</SelectItem>
                                  <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                                  <SelectItem value="Accepted">Accepted</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                  <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                                  <SelectItem value="Deferred">Deferred</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setAddingUniversity(false);
                              universityForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add University</Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {universities.map((university) => (
                  <Card key={university.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <University className="h-6 w-6 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{university.university_name}</h4>
                              <Badge variant="outline">{university.status}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{university.course_name}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Application Date</p>
                                <p className="text-muted-foreground">
                                  {university.application_date ? format(new Date(university.application_date), 'PPP') : 'Not set'}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Response Date</p>
                                <p className="text-muted-foreground">
                                  {university.response_date ? format(new Date(university.response_date), 'PPP') : 'Pending'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUniversity(university.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {universities.length === 0 && !addingUniversity && (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-12">
                      <University className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No University Applications</h3>
                      <p className="text-muted-foreground mb-4">
                        No university applications have been added yet.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setAddingUniversity(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First University
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Uploaded Documents</h3>
                <p className="text-sm text-muted-foreground">All documents uploaded for this student</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((document) => (
                  <Card key={document.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <h4 className="font-semibold">{document.file_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {document.document_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span>•</span>
                              <span>Uploaded {format(new Date(document.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(document)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {documents.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Documents Uploaded</h3>
                    <p className="text-muted-foreground">
                      There are no documents associated with this student's application yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* A simple placeholder for the Timeline tab */}
            <TabsContent value="timeline" className="mt-6">
               <Card>
                <CardHeader>
                  <CardTitle>Application Timeline</CardTitle>
                  <CardDescription>A chronological view of all application events.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4"/>
                    <p>Timeline feature is not yet implemented.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}