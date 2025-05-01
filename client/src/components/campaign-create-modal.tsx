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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCampaignSchema, Campaign } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { ImageIcon } from "lucide-react";

// Extend the insertCampaignSchema from shared/schema.ts but omit restaurantId (which is set by server)
const formSchema = insertCampaignSchema
  .omit({ restaurantId: true })
  .extend({
    // Add URL validation
    imageUrl: z.string()
      .min(1, "Image URL is required")
      .refine(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
        "URL must start with http:// or https://"
      ),
  });

type FormValues = z.infer<typeof formSchema>;

interface CampaignCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Campaign;
}

export function CampaignCreateModal({
  isOpen,
  onClose,
  initialData,
}: CampaignCreateModalProps) {
  const { toast } = useToast();
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      imageUrl: "",
      rewardAmount: 10,
      rewardViews: 1000,
      status: "active",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      console.log("Submitting form with data:", data);
      setIsSubmitting(true);

      if (isEditing) {
        console.log("Updating campaign", initialData.id);
        const response = await apiRequest("PUT", `/api/campaigns/${initialData.id}`, data);
        console.log("Update response:", response);
        toast({
          title: "Campaign updated",
          description: "The campaign has been successfully updated",
        });
      } else {
        console.log("Creating new campaign");
        const response = await apiRequest("POST", "/api/campaigns", data);
        console.log("Create response:", response);
        toast({
          title: "Campaign created",
          description: "The campaign has been successfully created",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting campaign:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} the campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug form errors
  console.log("Form errors:", form.formState.errors);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Campaign" : "Create New Campaign"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(
            data => {
              console.log("Form submitted successfully with data:", data);
              onSubmit(data);
            }, 
            errors => {
              console.error("Form validation failed:", errors);
              toast({
                title: "Validation Error",
                description: "Please check the form for errors",
                variant: "destructive",
              });
            }
          )} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Image URL</FormLabel>
                  <FormControl>
                    <div className="grid gap-2">
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                      {field.value && (
                        <div className="w-full h-32 rounded-md border overflow-hidden">
                          <img
                            src={field.value}
                            alt="Campaign preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Just hide the broken image but don't reset the field value
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.classList.add("flex", "items-center", "justify-center", "bg-muted");
                                const errorMsg = document.createElement("div");
                                errorMsg.className = "text-sm text-muted-foreground p-2 text-center";
                                errorMsg.textContent = "Image failed to load";
                                e.currentTarget.parentElement.appendChild(errorMsg);
                              }
                            }}
                          />
                        </div>
                      )}
                      {!field.value && (
                        <div className="border-2 border-dashed border-muted rounded-md p-4 text-center">
                          <div className="space-y-2">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="text-primary">Enter an image URL</span>
                              <span> above to preview</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Use a direct link to an image (JPG, PNG, GIF)
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
                      placeholder="Describe your campaign"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={0.1}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rewardViews"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per Views</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={100}
                        step={100}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="draft" id="draft" />
                        <Label htmlFor="draft">Draft</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
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
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Campaign"
                  : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
