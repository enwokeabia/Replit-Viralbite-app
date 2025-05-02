import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrivateInvitationSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Create a form schema for private invitations
const formSchema = insertPrivateInvitationSchema.extend({
  imageUrl: z.string().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  influencerId: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface PrivateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivateInvitationModal({ isOpen, onClose }: PrivateInvitationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadTab, setUploadTab] = useState<"url" | "file">("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get list of influencers for dropdown
  const { data: influencers, isLoading: isLoadingInfluencers } = useQuery({
    queryKey: ["/api/users/influencers"],
    queryFn: async () => {
      const res = await fetch("/api/users/influencers");
      if (!res.ok) throw new Error("Failed to fetch influencers");
      return await res.json();
    },
    enabled: isOpen && !!user,
  });

  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: null,
      restaurantId: user?.id || 0,
      influencerId: 0,
      rewardAmount: 50,
      rewardViews: 10000,
      expiresAt: null,
    },
  });

  // Set restaurant ID when user data is available
  useEffect(() => {
    if (user) {
      form.setValue("restaurantId", user.id);
    }
  }, [user, form]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      setUploadTab("url");
    }
  }, [isOpen, form]);

  // Handle image file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Handle image upload
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Create FormData with the image file
      const formData = new FormData();
      formData.append('image', file);
      
      // Send the file to our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      
      const result = await response.json();
      return result.url;
    } finally {
      setIsUploading(false);
    }
  };

  // Create mutation for submitting form
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // If there's an image file, upload it first
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        data.imageUrl = imageUrl;
      }
      
      const res = await apiRequest("POST", "/api/private-invitations", data);
      if (!res.ok) throw new Error("Failed to create invitation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/private-invitations"] });
      toast({
        title: "Invitation created",
        description: "Your private invitation has been created successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    createMutation.mutate(data);
  };

  const isPending = form.formState.isSubmitting || createMutation.isPending || isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create Private Invitation</DialogTitle>
          <DialogDescription>
            Create a personalized invitation for a specific influencer
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="influencerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Influencer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an influencer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {isLoadingInfluencers ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2">Loading influencers...</span>
                          </div>
                        ) : influencers?.length > 0 ? (
                          influencers.map((influencer: any) => (
                            <SelectItem key={influencer.id} value={influencer.id.toString()}>
                              {influencer.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No influencers found
                          </div>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invitation title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain what you're looking for in this campaign"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
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
                    <FormLabel>Reward Views</FormLabel>
                    <FormControl>
                      <Input type="number" min="1000" step="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Campaign Image (Optional)</FormLabel>
              <Tabs value={uploadTab} onValueChange={(value) => setUploadTab(value as "url" | "file")} className="mt-2">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="url" className="flex-1">Image URL</TabsTrigger>
                  <TabsTrigger value="file" className="flex-1">Upload File</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Enter image URL" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="file">
                  <div className="space-y-4">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      disabled={isPending}
                    />
                    {imagePreview && (
                      <div className="aspect-video overflow-hidden rounded-md bg-muted flex items-center justify-center">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="object-contain max-h-[200px]"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-purple-700 hover:bg-purple-800 text-white"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}