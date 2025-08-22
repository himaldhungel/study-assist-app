import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Upload, 
  Globe, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar as CalendarIcon, 
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddStudentForm } from "@/components/forms/AddStudentForm";
import { UploadDocumentsForm } from "@/components/forms/UploadDocumentsForm";
import { TrackApplicationForm } from "@/components/forms/TrackApplicationForm";
import { UpdateStatusForm } from "@/components/forms/UpdateStatusForm";
import { StudentApplicationDetails } from "@/components/forms/StudentApllicationDetails";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import DOMPurify from 'dompurify';

// Types
interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

type ApplicationStatus = 
  | 'documents_pending'
  | 'documents_submitted' 
  | 'application_sent'
  | 'offer_received'
  | 'visa_applied'
  | 'completed';

// Constants
const APPLICATION_STATUS = {
  DOCUMENTS_PENDING: 'documents_pending' as const,
  DOCUMENTS_SUBMITTED: 'documents_submitted' as const,
  APPLICATION_SENT: 'application_sent' as const,
  OFFER_RECEIVED: 'offer_received' as const,
  VISA_APPLIED: 'visa_applied' as const,
  COMPLETED: 'completed' as const,
};

const STATUS_LABELS = {
  [APPLICATION_STATUS.DOCUMENTS_PENDING]: 'Documents Pending',
  [APPLICATION_STATUS.DOCUMENTS_SUBMITTED]: 'Documents Submitted',
  [APPLICATION_STATUS.APPLICATION_SENT]: 'Application Sent',
  [APPLICATION_STATUS.OFFER_RECEIVED]: 'Offer Received',
  [APPLICATION_STATUS.VISA_APPLIED]: 'Visa Applied',
  [APPLICATION_STATUS.COMPLETED]: 'Completed',
};

const STATUS_COLORS = {
  [APPLICATION_STATUS.DOCUMENTS_PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [APPLICATION_STATUS.DOCUMENTS_SUBMITTED]: "bg-blue-100 text-blue-800 border-blue-200",
  [APPLICATION_STATUS.APPLICATION_SENT]: "bg-purple-100 text-purple-800 border-purple-200",
  [APPLICATION_STATUS.OFFER_RECEIVED]: "bg-green-100 text-green-800 border-green-200",
  [APPLICATION_STATUS.VISA_APPLIED]: "bg-orange-100 text-orange-800 border-orange-200",
  [APPLICATION_STATUS.COMPLETED]: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

// Utility functions
const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input.trim());
};

const getStatusColor = (status: ApplicationStatus) => {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusLabel = (status: ApplicationStatus) => {
  return STATUS_LABELS[status] || status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

const exportToCSV = (students: Student[]) => {
  const csv = students.map(student => ({
    'Full Name': student.full_name,
    'Email': student.email || '',
    'Phone': student.phone || '',
    'Status': getStatusLabel(student.status),
    'Created At': format(new Date(student.created_at), 'yyyy-MM-dd'),
  }));
  
  const headers = Object.keys(csv[0]);
  const csvContent = [
    headers.join(','),
    ...csv.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `students-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Loading component
const LoadingCard = ({ title }: { title?: string }) => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-muted rounded w-20" />
          <div className="h-8 bg-muted rounded w-20" />
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyState = ({ 
  title, 
  description, 
  action 
}: { 
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card className="border-2 border-dashed border-muted-foreground/25">
    <CardContent className="flex flex-col items-center justify-center py-16">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
      {action}
    </CardContent>
  </Card>
);

// Stats card component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "text-primary" 
}: { 
  title: string;
  value: number;
  icon: any;
  color?: string;
}) => (
  <Card className="hover:shadow-medium transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${color}`}>
            {value}
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Main Applications Component
const Applications = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.phone?.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => ({
    total: students.length,
    pending: students.filter(s => s.status === APPLICATION_STATUS.DOCUMENTS_PENDING).length,
    inProcess: students.filter(s => 
      ([APPLICATION_STATUS.DOCUMENTS_SUBMITTED, APPLICATION_STATUS.APPLICATION_SENT] as ApplicationStatus[]).includes(s.status)
    ).length,
    completed: students.filter(s => s.status === APPLICATION_STATUS.COMPLETED).length,
    offers: students.filter(s => s.status === APPLICATION_STATUS.OFFER_RECEIVED).length,
  }), [students]);

  // Fetch students with error handling
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("application_students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      const message = error.message || 'Failed to fetch students';
      setError(message);
      handleError(error, 'fetchStudents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Error handler
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    toast({
      title: "Error",
      description: error?.message || 'An unexpected error occurred',
      variant: "destructive",
    });
  };

  // Optimistic update for status changes
  const updateStudentOptimistic = useCallback(async (studentId: string, updates: Partial<Student>) => {
    // Update UI immediately
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, ...updates } : s
    ));
    
    try {
      const { error } = await supabase
        .from('application_students')
        .update(updates)
        .eq('id', studentId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Student updated successfully!",
      });
    } catch (error: any) {
      // Revert changes on error
      fetchStudents();
      handleError(error, 'updateStudentOptimistic');
    }
  }, [fetchStudents, toast]);

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: ApplicationStatus) => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from('application_students')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', selectedStudents);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedStudents.length} student(s) to ${getStatusLabel(newStatus)}`,
      });

      setSelectedStudents([]);
      fetchStudents();
    } catch (error: any) {
      handleError(error, 'handleBulkStatusUpdate');
    }
  };

  // Initialize data
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 bg-muted rounded w-64 mb-2" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
          <div className="h-10 bg-muted rounded w-32" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-muted rounded w-12 mb-2" />
                <div className="h-4 bg-muted rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStudents}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
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
        <div className="flex gap-2">
          {students.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportToCSV(filteredStudents)}
              className="hidden sm:flex"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
          <AddStudentForm onStudentAdded={fetchStudents} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.total}
          icon={User}
          color="text-primary"
        />
        <StatsCard
          title="Documents Pending"
          value={stats.pending}
          icon={FileText}
          color="text-yellow-600"
        />
        <StatsCard
          title="In Process"
          value={stats.inProcess}
          icon={RefreshCw}
          color="text-blue-600"
        />
        <StatsCard
          title="Offers Received"
          value={stats.offers}
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="text-emerald-600"
        />
      </div>

      {/* Filters and Search */}
      {students.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <SelectItem key={status} value={status}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(searchQuery || statusFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {selectedStudents.length} student(s) selected
              </p>
              <div className="flex gap-2">
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Update status for selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <SelectItem key={status} value={status}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.length === 0 ? (
          students.length === 0 ? (
            <EmptyState
              title="No Students Yet"
              description="Add your first student to start managing university applications and documents."
              action={
                <AddStudentForm 
                  onStudentAdded={fetchStudents}
                  trigger={
                    <Button size="lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Student
                    </Button>
                  }
                />
              }
            />
          ) : (
            <EmptyState
              title="No Students Found"
              description="Try adjusting your search criteria or filters to find students."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-medium transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(prev => [...prev, student.id]);
                        } else {
                          setSelectedStudents(prev => prev.filter(id => id !== student.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="text-xs">
                          Added {format(new Date(student.created_at), 'MMM dd, yyyy')}
                        </span>
                        {student.updated_at !== student.created_at && (
                          <span className="text-xs">
                            Updated {format(new Date(student.updated_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(student.status)}>
                    {getStatusLabel(student.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{student.address}</span>
                    </div>
                  )}
                  {student.date_of_birth && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>DOB: {format(new Date(student.date_of_birth), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <UploadDocumentsForm 
                    studentId={student.id}
                    studentName={student.full_name}
                    onDocumentUploaded={fetchStudents}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Documents
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
                        Applications
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
                        Status
                      </Button>
                    }
                  />
                  <StudentApplicationDetails
                    studentId={student.id}
                    onUpdate={fetchStudents}
                    trigger={
                      <Button variant="default" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Details
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