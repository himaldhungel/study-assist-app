import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Classes = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Language Classes</h1>
          <p className="text-muted-foreground">Manage batches and student enrollments</p>
        </div>
        <Button
          onClick={() => toast({
            title: "Create New Batch",
            description: "Batch creation form will be implemented here.",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Batch
        </Button>
      </div>

      {/* Coming Soon */}
      <Card className="text-center py-12">
        <CardContent>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">Language Classes Management</CardTitle>
          <CardDescription className="text-lg mb-6 max-w-2xl mx-auto">
            This section will allow you to create and manage language class batches (IELTS, PTE, Japanese, etc.), 
            enroll students, and track their progress.
          </CardDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-success/10 rounded-full mb-3">
                <Plus className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Create Batches</h3>
              <p className="text-sm text-muted-foreground text-center">
                Set up IELTS, PTE, Japanese and other language classes with start/end dates
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-info/10 rounded-full mb-3">
                <Users className="h-6 w-6 text-info" />
              </div>
              <h3 className="font-semibold mb-2">Manage Students</h3>
              <p className="text-sm text-muted-foreground text-center">
                Add students to batches and track their enrollment details
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4">
              <div className="p-3 bg-warning/10 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground text-center">
                Monitor class schedules and student attendance
              </p>
            </div>
          </div>
          
          <Button 
            className="mt-8" 
            size="lg"
            onClick={() => toast({
              title: "Get Started with Classes",
              description: "Class management features will be implemented here.",
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Get Started with Classes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Classes;