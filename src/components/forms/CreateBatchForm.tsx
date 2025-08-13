import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const batchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  class_type: z.string().min(1, "Class type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type BatchFormData = z.infer<typeof batchSchema>;

interface CreateBatchFormProps {
  onBatchCreated: () => void;
  trigger?: React.ReactNode;
}

export function CreateBatchForm({ onBatchCreated, trigger }: CreateBatchFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
  });

  const onSubmit = async (data: BatchFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create a batch");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      const { error } = await supabase.from("language_batches").insert({
        name: data.name,
        class_type: data.class_type,
        start_date: data.start_date,
        end_date: data.end_date,
        created_by: profile.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Language batch created successfully!",
      });

      reset();
      setOpen(false);
      onBatchCreated();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Batch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Create a new language class batch for students.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., IELTS Batch 1 - January 2024"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_type">Class Type *</Label>
            <Select onValueChange={(value) => setValue("class_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="PTE">PTE</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="Japanese">Japanese Language</SelectItem>
                <SelectItem value="Korean">Korean Language</SelectItem>
                <SelectItem value="French">French Language</SelectItem>
                <SelectItem value="German">German Language</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.class_type && (
              <p className="text-sm text-destructive">{errors.class_type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
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
              {loading ? "Creating..." : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}