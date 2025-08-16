import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  status: z.enum(["documents_pending", "documents_submitted", "application_sent", "offer_received", "visa_applied", "completed"], { message: "Please select a status." }),
});

interface UpdateStatusFormProps {
  studentId: string;
  studentName: string;
  currentStatus: string;
  onStatusUpdated: () => void;
  trigger?: React.ReactNode;
}

export function UpdateStatusForm({ studentId, studentName, currentStatus, onStatusUpdated, trigger }: UpdateStatusFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: currentStatus as any,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("application_students")
        .update({ status: values.status })
        .eq("id", studentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Status for ${studentName} has been updated successfully.`,
      });

      setOpen(false);
      onStatusUpdated();
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

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CheckCircle className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Update the application status for {studentName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current Status: <span className="font-medium">{getStatusLabel(currentStatus)}</span>
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}