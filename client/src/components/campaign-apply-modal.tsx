import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Campaign } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const submissionSchema = z.object({
  instagramUrl: z
    .string()
    .url("Please enter a valid URL")
    .includes("instagram.com", { message: "Must be an Instagram URL" }),
  notes: z.string().optional(),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
});

type FormValues = z.infer<typeof submissionSchema>;

interface CampaignApplyModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignApplyModal({
  campaign,
  isOpen,
  onClose,
}: CampaignApplyModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      instagramUrl: "",
      notes: "",
      termsAgreed: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const { termsAgreed, ...submissionData } = data;
      
      await apiRequest("POST", `/api/campaigns/${campaign.id}/submissions`, submissionData);
      
      toast({
        title: "Application submitted",
        description: "Your submission has been received",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to Campaign</DialogTitle>
        </DialogHeader>

        <div className="flex items-start mb-4">
          <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0 mr-3">
            {campaign.imageUrl ? (
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{campaign.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{campaign.description}</p>
            <p className="text-xs text-primary mt-1">
              ${campaign.rewardAmount} per {campaign.rewardViews} views
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Reel Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.instagram.com/reel/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the link to your Instagram Reel here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about your submission"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAgreed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that this content is original, complies with Instagram's policies, and meets the campaign requirements.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
