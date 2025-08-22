import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  Edit, 
  Plus, 
  Download, 
  FileText, 
  Calendar, 
  University, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  Upload,
  File,
  X,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import DOMPurify from 'dompurify';

// Types
interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  passport_number: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

interface University {
  id: string;
  university_name: string;
  course_name: string;
  application_date: string;
  response_date: string;
  status: UniversityStatus;
  notes: string;
  application_fee: number;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: DocumentType;
  file_size: number;
  created_at: string;
  updated_at: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  metadata?: any;
}

type ApplicationStatus = 
  | 'documents_pending'
  | 'documents_submitted' 
  | 'application_sent'
  | 'offer_received'
  | 'visa_applied'
  | 'completed';

type UniversityStatus = 
  | 'preparing'
  | 'applied'
  | 'under_review'
  | 'interview_scheduled'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'
  | 'deferred'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined';

type DocumentType = 
  | 'passport'
  | 'transcript'
  | 'diploma'
  | 'recommendation_letter'
  | 'personal_statement'
  | 'test_scores'
  | 'financial_documents'
  | 'other';

// Constants
const UNIVERSITY_STATUS_OPTIONS = [
  { value: 'preparing', label: 'Preparing Application', color: 'bg-gray-100 text-gray-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'bg-purple-100 text-purple-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'waitlisted', label: 'Waitlisted', color: 'bg-orange-100 text-orange-800' },
  { value: 'deferred', label: 'Deferred', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'offer_received', label: 'Offer Received', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-200 text-green-900' },
  { value: 'offer_declined', label: 'Offer Declined', color: 'bg-red-200 text-red-900' },
];

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport', icon: CreditCard },
  { value: 'transcript', label: 'Academic Transcript', icon: FileText },
  { value: 'diploma', label: 'Diploma/Certificate', icon: FileText },
  { value: 'recommendation_letter', label: 'Recommendation Letter', icon: Mail },
  { value: 'personal_statement', label: 'Personal Statement', icon: Edit },
  { value: 'test_scores', label: 'Test Scores (IELTS/TOEFL/GRE)', icon: FileText },
  { value: 'financial_documents', label: 'Financial Documents', icon: CreditCard },
  { value: 'other', label: 'Other', icon: File },
];

const APPLICATION_STATUS_OPTIONS = [
  { value: 'documents_pending', label: 'Documents Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'documents_submitted', label: 'Documents Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'application_sent', label: 'Application Sent', color: 'bg-purple-100 text-purple-800' },
  { value: 'offer_received', label: 'Offer Received', color: 'bg-green-100 text-green-800' },
  { value: 'visa_applied', label: 'Visa Applied', color: 'bg-orange-100 text-orange-800' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
];

// Schemas
const studentSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .regex(/^[\+]?[\d\s\-\(\)]{7,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  date_of_birth: z.string()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16 && age <= 100;
    }, "Student must be between 16 and 100 years old")
    .optional()
    .or(z.literal("")),
  passport_number: z.string()
    .min(6, "Passport number must be at least 6 characters")
    .max(12, "Passport number must be less than 12 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(['documents_pending', 'documents_submitted', 'application_sent', 'offer_received', 'visa_applied', 'completed']),
});

const universitySchema = z.object({
  university_name: z.string().min(1, "University name is required"),
  course_name: z.string().min(1, "Course name is required"),
  application_date: z.string().optional().or(z.literal("")),
  response_date: z.string().optional().or(z.literal("")),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional().or(z.literal("")),
  application_fee: z.number().min(0).optional(),
});

// Utility functions
const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input.trim());
};

const getStatusBadge = (status: string, options: any[]) => {
  const statusOption = options.find(option => option.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800 border-gray-200';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addingUniversity, setAddingUniversity] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<string | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const { toast } = useToast();

  // Forms
  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
  });

  const universityForm = useForm<z.infer<typeof universitySchema>>({
    resolver: zodResolver(universitySchema),
  });

  const editUniversityForm = useForm<z.infer<typeof universitySchema>>({
    resolver: zodResolver(universitySchema),
  });

  // Error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    toast({
      title: "Error",
      description: error?.message || 'An unexpected error occurred',
      variant: "destructive",
    });
  }, [toast]);

  // Load student data
  const loadStudentData = useCallback(async () => {
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
      setUniversities(
        (universitiesData || []).map((u: any) => ({
          ...u,
          notes: u.notes ?? "",
          application_fee: u.application_fee ?? 0,
          updated_at: u.updated_at ?? u.created_at ?? "",
        }))
      );

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(
        (documentsData || []).map((doc: any) => ({
          ...doc,
          file_size: doc.file_size ?? 0,
          updated_at: doc.updated_at ?? doc.created_at ?? "",
        }))
      );

      // Load timeline events
      const { data: timelineData, error: timelineError } = await (supabase as any)
        .from('timeline_events')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (timelineError && timelineError.code !== 'PGRST116') {
        // PGRST116 means table doesn't exist, which is fine for timeline
        throw timelineError;
      }
      setTimeline(timelineData || []);

    } catch (error: any) {
      handleError(error, 'loadStudentData');
    } finally {
      setLoading(false);
    }
  }, [studentId, studentForm, handleError]);

  // Add timeline event
  const addTimelineEvent = useCallback(async (eventType: string, description: string, metadata?: any) => {
    try {
      const { error } = await (supabase as any)
        .from('timeline_events')
        .insert({
          student_id: studentId,
          event_type: eventType,
          description,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        });

      if (error && error.code !== 'PGRST116') {
        // Silently fail if timeline table doesn't exist
        console.warn('Timeline event not recorded:', error);
      }
    } catch (error) {
      console.warn('Failed to add timeline event:', error);
    }
  }, [studentId]);

  // Update student details
  const updateStudent = async (data: z.infer<typeof studentSchema>) => {
    try {
      const sanitizedData = {
        ...data,
        full_name: sanitizeInput(data.full_name),
        email: data.email ? sanitizeInput(data.email) : null,
        phone: data.phone ? sanitizeInput(data.phone) : null,
        address: data.address ? sanitizeInput(data.address) : null,
        passport_number: data.passport_number ? sanitizeInput(data.passport_number).toUpperCase() : null,
        date_of_birth: data.date_of_birth || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('application_students')
        .update(sanitizedData)
        .eq('id', studentId);

      if (error) throw error;

      await addTimelineEvent('student_updated', 'Student information was updated');

      toast({
        title: "Success",
        description: "Student details updated successfully!",
      });

      setEditMode(false);
      loadStudentData();
      onUpdate?.();
    } catch (error: any) {
      handleError(error, 'updateStudent');
    }
  };

  // Add university
  const addUniversity = async (data: z.infer<typeof universitySchema>) => {
    try {
      const sanitizedData = {
        ...data,
        university_name: sanitizeInput(data.university_name),
        course_name: sanitizeInput(data.course_name),
        notes: data.notes ? sanitizeInput(data.notes) : null,
        student_id: studentId,
        application_date: data.application_date || null,
        response_date: data.response_date || null,
        application_fee: data.application_fee || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('universities')
        .insert(sanitizedData);

      if (error) throw error;

      await addTimelineEvent('university_added', `Added application to ${data.university_name} for ${data.course_name}`);

      toast({
        title: "Success",
        description: "University application added successfully!",
      });

      universityForm.reset();
      setAddingUniversity(false);
      loadStudentData();
    } catch (error: any) {
      handleError(error, 'addUniversity');
    }
  };

  // Update university
  const updateUniversity = async (universityId: string, data: z.infer<typeof universitySchema>) => {
    try {
      const sanitizedData = {
        ...data,
        university_name: sanitizeInput(data.university_name),
        course_name: sanitizeInput(data.course_name),
        notes: data.notes ? sanitizeInput(data.notes) : null,
        application_date: data.application_date || null,
        response_date: data.response_date || null,
        application_fee: data.application_fee || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('universities')
        .update(sanitizedData)
        .eq('id', universityId);

      if (error) throw error;

      await addTimelineEvent('university_updated', `Updated application status for ${data.university_name}`);

      toast({
        title: "Success",
        description: "University application updated successfully!",
      });

      editUniversityForm.reset();
      setEditingUniversity(null);
      loadStudentData();
    } catch (error: any) {
      handleError(error, 'updateUniversity');
    }
  };

  // Delete university
  const deleteUniversity = async (universityId: string, universityName: string) => {
    if (!confirm(`Are you sure you want to delete the application to ${universityName}?`)) return;

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', universityId);

      if (error) throw error;

      await addTimelineEvent('university_deleted', `Removed application to ${universityName}`);

      toast({
        title: "Success",
        description: "University application deleted successfully!",
      });

      loadStudentData();
    } catch (error: any) {
      handleError(error, 'deleteUniversity');
    }
  };

  // Upload documents
  const handleDocumentUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingDocuments(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            student_id: studentId,
            file_name: file.name,
            file_path: uploadData.path,
            document_type: 'other', // Default type, can be updated later
            created_at: new Date().toISOString(),
            uploaded_by: 'system', // Add a default value or get the actual user ID
          });

        if (dbError) throw dbError;

        await addTimelineEvent('document_uploaded', `Uploaded document: ${file.name}`);

      } catch (error: any) {
        handleError(error, `uploadDocument-${file.name}`);
      }
    });

    try {
      await Promise.all(uploadPromises);
      toast({
        title: "Success",
        description: `${files.length} document(s) uploaded successfully!`,
      });
      loadStudentData();
    } catch (error) {
      // Individual errors already handled
    } finally {
      setUploadingDocuments(false);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await addTimelineEvent('document_downloaded', `Downloaded document: ${doc.file_name}`);
    } catch (error: any) {
      handleError(error, 'downloadDocument');
    }
  };

  // Delete document
  const deleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete ${doc.file_name}?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      await addTimelineEvent('document_deleted', `Deleted document: ${doc.file_name}`);

      toast({
        title: "Success",
        description: "Document deleted successfully!",
      });

      loadStudentData();
    } catch (error: any) {
      handleError(error, 'deleteDocument');
    }
  };

  // Initialize data
  useEffect(() => {
    if (open) {
      loadStudentData();
    }
  }, [open, loadStudentData]);

  // Computed values
  const universityStats = useMemo(() => {
    const total = universities.length;
    const accepted = universities.filter(u => u.status === 'accepted' || u.status === 'offer_received').length;
    const rejected = universities.filter(u => u.status === 'rejected').length;
    const pending = universities.filter(u => ['applied', 'under_review', 'preparing'].includes(u.status)).length;
    
    return { total, accepted, rejected, pending };
  }, [universities]);

  const documentStats = useMemo(() => {
    const total = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const types = [...new Set(documents.map(doc => doc.document_type))];
    
    return { total, totalSize, types: types.length };
  }, [documents]);

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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{student?.full_name} - Application Details</DialogTitle>
              <DialogDescription className="text-base">
                Complete application overview and management
              </DialogDescription>
            </div>
            <div className="flex gap-2 items-center">
              {student && (
                <Badge 
                  variant="outline" 
                  className={`${getStatusBadge(student.status, APPLICATION_STATUS_OPTIONS)} text-xs`}
                >
                  {APPLICATION_STATUS_OPTIONS.find(s => s.value === student.status)?.label}
                </Badge>
              )}
              {!editMode && !loading && (
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
              <RefreshCw className="animate-spin h-8 w-8 text-primary mx-auto" />
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
                Universities ({universityStats.total})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({documentStats.total})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Universities</p>
                        <p className="text-2xl font-bold">{universityStats.total}</p>
                      </div>
                      <University className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Offers</p>
                        <p className="text-2xl font-bold text-green-600">{universityStats.accepted}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Documents</p>
                        <p className="text-2xl font-bold">{documentStats.total}</p>
                      </div>
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="text-2xl font-bold">{formatFileSize(documentStats.totalSize)}</p>
                      </div>
                      <File className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Student Information */}
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
                                  <Input type="email" {...field} />
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
                                    {APPLICATION_STATUS_OPTIONS.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
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
                                <Textarea {...field} className="resize-none" rows={3} />
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
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Full Name</p>
                          <p className="text-muted-foreground truncate">{student?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Email</p>
                          <p className="text-muted-foreground truncate">{student?.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Phone</p>
                          <p className="text-muted-foreground">{student?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Date of Birth</p>
                          <p className="text-muted-foreground">
                            {student?.date_of_birth ? format(new Date(student.date_of_birth), 'PPP') : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Passport Number</p>
                          <p className="text-muted-foreground">{student?.passport_number || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Address</p>
                          <p className="text-muted-foreground">{student?.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline.length > 0 ? (
                    <div className="space-y-3">
                      {timeline.slice(0, 5).map((event, index) => (
                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{event.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM dd, yyyy • HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {timeline.length > 5 && (
                        <p className="text-xs text-center text-muted-foreground mt-3">
                          View Timeline tab for complete activity history
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="universities" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">University Applications</h3>
                  <p className="text-sm text-muted-foreground">
                    Track applications to different universities • {universityStats.accepted} offers received
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingUniversity(true)}
                  disabled={addingUniversity}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add University
                </Button>
              </div>

              {/* University Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{universityStats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{universityStats.accepted}</div>
                    <div className="text-sm text-muted-foreground">Accepted</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{universityStats.rejected}</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">{universityStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
              </div>

              {addingUniversity && (
                <Card className="border-2 border-dashed border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Add University Application
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingUniversity(false);
                          universityForm.reset();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
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
                                <FormLabel>Expected Response Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                                    {UNIVERSITY_STATUS_OPTIONS.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={universityForm.control}
                            name="application_fee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Application Fee ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={universityForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any additional notes about this application..."
                                  className="resize-none" 
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
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
                          <Button type="submit">
                            <Plus className="mr-2 h-4 w-4" />
                            Add University
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {universities.map((university) => (
                  <Card key={university.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      {editingUniversity === university.id ? (
                        <Form {...editUniversityForm}>
                          <form 
                            onSubmit={editUniversityForm.handleSubmit((data) => updateUniversity(university.id, data))} 
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={editUniversityForm.control}
                                name="university_name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>University Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editUniversityForm.control}
                                name="course_name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Course Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editUniversityForm.control}
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
                                control={editUniversityForm.control}
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
                              <FormField
                                control={editUniversityForm.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Application Status *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {UNIVERSITY_STATUS_OPTIONS.map(option => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editUniversityForm.control}
                                name="application_fee"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Application Fee ($)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="0" 
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={editUniversityForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea className="resize-none" rows={3} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setEditingUniversity(null);
                                  editUniversityForm.reset();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">
                                <Save className="mr-2 h-4 w-4" />
                                Update University
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <University className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold text-lg">{university.university_name}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={getStatusBadge(university.status, UNIVERSITY_STATUS_OPTIONS)}
                                >
                                  {UNIVERSITY_STATUS_OPTIONS.find(s => s.value === university.status)?.label}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{university.course_name}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Application Date</p>
                                  <p className="text-muted-foreground">
                                    {university.application_date ? format(new Date(university.application_date), 'MMM dd, yyyy') : 'Not set'}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium">Response Date</p>
                                  <p className="text-muted-foreground">
                                    {university.response_date ? format(new Date(university.response_date), 'MMM dd, yyyy') : 'Pending'}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium">Application Fee</p>
                                  <p className="text-muted-foreground">
                                    ${university.application_fee ? university.application_fee.toFixed(2) : '0.00'}
                                  </p>
                                </div>
                              </div>
                              {university.notes && (
                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{university.notes}</p>
                                </div>
                              )}
                              {university.updated_at && university.updated_at !== university.created_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Last updated: {format(new Date(university.updated_at), 'MMM dd, yyyy • HH:mm')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUniversity(university.id);
                                editUniversityForm.reset({
                                  university_name: university.university_name,
                                  course_name: university.course_name,
                                  application_date: university.application_date || "",
                                  response_date: university.response_date || "",
                                  status: university.status,
                                  notes: university.notes || "",
                                  application_fee: university.application_fee || 0,
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUniversity(university.id, university.university_name)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {universities.length === 0 && !addingUniversity && (
                  <Card className="border-2 border-dashed">
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
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    All documents uploaded for this student • {formatFileSize(documentStats.totalSize)} total
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                    className="hidden"
                    id="document-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('document-upload')?.click()}
                    disabled={uploadingDocuments}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingDocuments ? 'Uploading...' : 'Upload Documents'}
                  </Button>
                </div>
              </div>

              {/* Document Type Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DOCUMENT_TYPES.map(type => {
                  const count = documents.filter(doc => doc.document_type === type.value).length;
                  const Icon = type.icon;
                  return (
                    <Card key={type.value}>
                      <CardContent className="pt-4 text-center">
                        <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-lg font-semibold">{count}</div>
                        <div className="text-xs text-muted-foreground">{type.label}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((document) => {
                  const documentType = DOCUMENT_TYPES.find(type => type.value === document.document_type);
                  const Icon = documentType?.icon || File;
                  
                  return (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold truncate">{document.file_name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {documentType?.label || document.document_type}
                                </Badge>
                                <span>•</span>
                                <span>{formatFileSize(document.file_size || 0)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Uploaded {format(new Date(document.created_at), 'MMM dd, yyyy • HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(document)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(document)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {documents.length === 0 && (
                <Card className="border-2 border-dashed">
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Documents Uploaded</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload documents related to this student's application.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('document-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Document
                    </Button>
                  </CardContent>
                </Card>
              )}

              {uploadingDocuments && (
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    Uploading documents... Please wait.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Application Timeline
                  </CardTitle>
                  <CardDescription>
                    A complete chronological history of all application events and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeline.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                      <div className="space-y-6">
                        {timeline.map((event, index) => (
                          <div key={event.id} className="relative flex items-start gap-4">
                            <div className="absolute left-4 w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 border-2 border-background"></div>
                            <div className="ml-8 flex-1">
                              <div className="bg-card rounded-lg border p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{event.description}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(event.created_at), 'EEEE, MMMM do, yyyy • HH:mm')}
                                    </p>
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                      <div className="mt-2 text-xs">
                                        <details className="cursor-pointer">
                                          <summary className="text-muted-foreground hover:text-foreground">
                                            View details
                                          </summary>
                                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                            {JSON.stringify(event.metadata, null, 2)}
                                          </pre>
                                        </details>
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {event.event_type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                      <h3 className="font-semibold mb-2">No Timeline Events</h3>
                      <p className="text-muted-foreground">
                        Activity timeline will appear here as you interact with this student's application.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}