import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
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
import { ImageIcon, Upload, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend the insertCampaignSchema from shared/schema.ts but omit restaurantId (which is set by server)
const formSchema = insertCampaignSchema
  .omit({ restaurantId: true })
  .extend({
    // Update validation to accept both http URLs and data URLs (from file uploads)
    imageUrl: z.string()
      .min(1, "Image URL is required")
      .refine(
        (url) => url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/"),
        "URL must be a valid image URL or uploaded file"
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  
  // Initialize the tab based on initial data
  useEffect(() => {
    if (initialData?.imageUrl) {
      // If the image URL is a data URL (uploaded image), set the tab to "upload"
      // Otherwise, set it to "url"
      setActiveTab(initialData.imageUrl.startsWith("data:image/") ? "upload" : "url");
    }
  }, [initialData]);

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
  
  // Handle file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Create a data URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setUploadedImage(result);
      
      // Set the URL for the form
      form.setValue("imageUrl", result);
    };
    reader.readAsDataURL(file);
  };

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
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
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
                  <FormLabel>Campaign Image</FormLabel>
                  <FormControl>
                    <div className="grid gap-4">
                      <Tabs 
                        defaultValue={activeTab} 
                        value={activeTab}
                        className="w-full" 
                        onValueChange={(value) => setActiveTab(value as "upload" | "url")}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload size={14} />
                            <span>Upload</span>
                          </TabsTrigger>
                          <TabsTrigger value="url" className="flex items-center gap-2">
                            <LinkIcon size={14} />
                            <span>URL</span>
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="pt-2">
                          <div className="border-2 border-dashed border-muted rounded-md p-4 text-center hover:border-primary/50 transition cursor-pointer">
                            <Input 
                              id="image-upload"
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                            <label htmlFor="image-upload" className="block cursor-pointer">
                              <div className="flex flex-col items-center gap-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                  <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <p className="text-sm font-medium">
                                  Click to upload image
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  JPG, PNG, GIF up to 5MB
                                </p>
                              </div>
                            </label>
                          </div>
                        </TabsContent>
                        <TabsContent value="url" className="pt-2">
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value.startsWith("data:image/") ? "" : field.value}
                          />
                          <FormDescription className="mt-1">
                            Enter a direct link to an image (JPG, PNG, GIF)
                          </FormDescription>
                        </TabsContent>
                      </Tabs>
                      
                      {field.value && (
                        <div className="w-full h-36 rounded-md border overflow-hidden">
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
                    </div>
                  </FormControl>
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
