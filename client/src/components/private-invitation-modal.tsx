import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrivateInvitationSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Extend the schema with frontend-specific validations
const formSchema = insertPrivateInvitationSchema.extend({
  influencerEmail: z.string().email("Please enter a valid email address"),
});

// Extract type from schema
type FormValues = z.infer<typeof formSchema>;

interface PrivateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivateInvitationModal({ isOpen, onClose }: PrivateInvitationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch influencers for the select dropdown
  const { data: influencers = [] } = useQuery<{ id: number; name: string; email: string }[]>({
    queryKey: ["/api/users/influencers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/influencers");
      return await res.json();
    },
    enabled: isOpen, // Only fetch when the modal is open
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      rewardAmount: 50,
      rewardViews: 10000,
      status: "pending",
    },
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Find the influencer ID from email
      const influencer = influencers.find(i => i.email === data.influencerEmail);
      if (!influencer) {
        throw new Error("Influencer not found with the provided email");
      }

      // Create invitation with influencer ID
      const invitationData = {
        ...data,
        influencerId: influencer.id,
      };
      
      // Remove the email field that was just for the form
      delete (invitationData as any).influencerEmail;
      
      const response = await apiRequest("POST", "/api/private-invitations", invitationData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Your private invitation has been sent to the influencer.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/private-invitations"] });
      setIsSubmitting(false);
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send invitation: ${error.message}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    createInvitationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Private Invitation</DialogTitle>
          <DialogDescription>
            Send a private, one-off invitation to a specific influencer. 
            The influencer will receive a unique invitation code.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="influencerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Influencer Email</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an influencer" />
                      </SelectTrigger>
                      <SelectContent>
                        {influencers.map((influencer) => (
                          <SelectItem key={influencer.id} value={influencer.email}>
                            {influencer.name} ({influencer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose the influencer you want to invite.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invitation Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Special Summer Promotion" {...field} />
                  </FormControl>
                  <FormDescription>
                    A catchy title for your invitation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you're looking for in this collaboration..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about the collaboration, including any specific requirements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add an image to showcase your restaurant or the collaboration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="50"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The amount to pay per view milestone.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rewardViews"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Views Milestone</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="100"
                        placeholder="10000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Pay the reward amount for every X views.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}