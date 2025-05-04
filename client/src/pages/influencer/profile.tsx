import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
  instagramHandle: z.string().optional(),
  profilePicture: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageSrc, setProfileImageSrc] = useState<string | undefined>(
    user?.profilePicture || undefined
  );
  
  // In a real application, this would come from the API
  const defaultValues: ProfileFormValues = {
    name: user?.name || "",
    bio: "",
    instagramHandle: "",
    profilePicture: "",
  };
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });
  
  // Handle profile picture upload with better compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Maintain aspect ratio while limiting size
        const maxDimension = 800;
        if (width > height && width > maxDimension) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Use higher quality JPEG compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setProfileImageSrc(compressedDataUrl);
          form.setValue("profilePicture", compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare the update data
      const updateData = {
        name: data.name,
        profilePicture: profileImageSrc || user?.profilePicture,
      };
      
      // Send the update to the server
      const response = await apiRequest('PUT', '/api/user/profile', updateData);
      const updatedUser = await response.json();
      
      // Update the user data in the authentication context
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching user data
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Profile" description="Manage your public profile information" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile Info</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>
                      This information will be visible to restaurants when reviewing your submissions
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <Avatar className="w-24 h-24 mx-auto">
                        <AvatarImage src={profileImageSrc} alt={user.name} />
                        <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="mt-4 text-center">
                        <label htmlFor="profile-picture" className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                          <Upload size={14} /> Upload profile picture
                        </label>
                        <Input 
                          id="profile-picture" 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleImageUpload} 
                        />
                      </div>
                    </div>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is the name that will be displayed to others
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell restaurants about yourself..."
                                  {...field}
                                  rows={4}
                                />
                              </FormControl>
                              <FormDescription>
                                Brief description of your content style and audience
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Accounts</CardTitle>
                    <CardDescription>
                      Link your social media accounts to help verify your identity
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="instagramHandle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram Handle</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md">
                                    @
                                  </span>
                                  <Input 
                                    className="rounded-l-none" 
                                    placeholder="username" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Your Instagram handle without the @ symbol
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}