import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Submission, PrivateSubmission, adminUpdateMetricSchema } from "@shared/schema";

// Schema for the form
const formSchema = adminUpdateMetricSchema;

type FormValues = z.infer<typeof formSchema>;

interface PerformanceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  privateSubmission: PrivateSubmission | null;
  onSuccess: () => void;
}

export function PerformanceUpdateModal({
  isOpen,
  onClose,
  submission,
  privateSubmission,
  onSuccess,
}: PerformanceUpdateModalProps) {
  const { toast } = useToast();
  const isPrivate = !!privateSubmission;
  const activeSubmission = isPrivate ? privateSubmission : submission;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      viewCount: activeSubmission?.views || 0,
      likeCount: 0, // Default to 0 if not available
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!activeSubmission) throw new Error("No submission selected");

      const endpoint = isPrivate
        ? `/api/admin/private-submissions/${activeSubmission.id}/performance`
        : `/api/admin/submissions/${activeSubmission.id}/performance`;

      const res = await apiRequest("POST", endpoint, data);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || "Failed to update performance metrics");
      }
      
      return res.json();
    },
    onSuccess: () => {
      onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating performance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  if (!activeSubmission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-purple-700 to-purple-500 inline-block text-transparent bg-clip-text">
            Update Performance Metrics
          </DialogTitle>
          <DialogDescription>
            Update the view and like counts for this submission. Earnings will be calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Submission ID</h4>
                  <p className="text-sm text-gray-500">{activeSubmission.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">
                    {isPrivate ? "Invitation ID" : "Campaign ID"}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isPrivate ? 
                      (activeSubmission as PrivateSubmission).invitationId : 
                      (activeSubmission as Submission).campaignId}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Instagram URL</h4>
                <a 
                  href={activeSubmission.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  {activeSubmission.instagramUrl}
                </a>
              </div>

              <FormField
                control={form.control}
                name="viewCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter view count"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Current reported views: {activeSubmission.views}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="likeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Like Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter like count"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the number of likes for this content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Performance"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}