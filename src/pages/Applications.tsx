import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload, Globe, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Applications = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Application Process</h1>
          <p className="text-muted-foreground">Manage university applications and documents</p>
        </div>
        <Button
          onClick={() => toast({
            title: "Add New Student",
            description: "Student application form will be implemented here.",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {/* Coming Soon */}
      <Card className="text-center py-12">
        <CardContent>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">Application Process Management</CardTitle>
          <CardDescription className="text-lg mb-6 max-w-2xl mx-auto">
            Comprehensive application tracking system for managing student applications to universities, 
            document uploads, and status monitoring.
          </CardDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-success/10 rounded-full mb-3">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Student Details</h3>
              <p className="text-sm text-muted-foreground text-center">
                Maintain comprehensive student profiles with personal information
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-info/10 rounded-full mb-3">
                <Upload className="h-6 w-6 text-info" />
              </div>
              <h3 className="font-semibold mb-2">Document Upload</h3>
              <p className="text-sm text-muted-foreground text-center">
                Secure document storage for passports, transcripts, and letters
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-warning/10 rounded-full mb-3">
                <Globe className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">University Tracking</h3>
              <p className="text-sm text-muted-foreground text-center">
                Track applications to multiple universities and courses
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-destructive/10 rounded-full mb-3">
                <CheckCircle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold mb-2">Status Updates</h3>
              <p className="text-sm text-muted-foreground text-center">
                Monitor progress from documents to visa completion
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-muted rounded-lg max-w-2xl mx-auto">
            <h4 className="font-semibold mb-3">Application Status Flow</h4>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-info/20 text-info rounded-full">Documents Pending</span>
              <span className="px-2 py-1">→</span>
              <span className="px-3 py-1 bg-warning/20 text-warning rounded-full">Documents Submitted</span>
              <span className="px-2 py-1">→</span>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full">Application Sent</span>
              <span className="px-2 py-1">→</span>
              <span className="px-3 py-1 bg-success/20 text-success rounded-full">Offer Received</span>
              <span className="px-2 py-1">→</span>
              <span className="px-3 py-1 bg-destructive/20 text-destructive rounded-full">Visa Applied</span>
              <span className="px-2 py-1">→</span>
              <span className="px-3 py-1 bg-success/40 text-success rounded-full">Completed</span>
            </div>
          </div>
          
          <Button 
            className="mt-8" 
            size="lg"
            onClick={() => toast({
              title: "Start Managing Applications",
              description: "Application management features will be implemented here.",
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Start Managing Applications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Applications;