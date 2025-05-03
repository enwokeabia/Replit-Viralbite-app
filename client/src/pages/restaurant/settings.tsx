import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bell, MapPin, Store, LockKeyhole } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Account settings form schema
const accountFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Restaurant profile form schema
const restaurantFormSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

// Notification settings form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  submissionAlerts: z.boolean(),
  paymentNotifications: z.boolean(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;
type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function RestaurantSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // In a real application, these would come from the API
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });
  
  const restaurantForm = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: user?.name || "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      website: "",
    },
  });
  
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      submissionAlerts: true,
      paymentNotifications: true,
    },
  });
  
  // Handle account form submission
  const onAccountSubmit = async (data: AccountFormValues) => {
    try {
      setIsSubmitting(true);
      // Mock API call - in a real app, this would update the user's account settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Account settings updated",
        description: "Your account settings have been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your account settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle restaurant form submission
  const onRestaurantSubmit = async (data: RestaurantFormValues) => {
    try {
      setIsSubmitting(true);
      // Mock API call - in a real app, this would update the user's restaurant profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Restaurant profile updated",
        description: "Your restaurant profile has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your restaurant profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle notification form submission
  const onNotificationSubmit = async (data: NotificationFormValues) => {
    try {
      setIsSubmitting(true);
      // Mock API call - in a real app, this would update the user's notification settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your notification settings. Please try again.",
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Settings" description="Manage your restaurant profile and account settings" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <Tabs defaultValue="restaurant" className="w-full">
              <TabsList className="mb-4 p-1 bg-gradient-to-r from-slate-100 to-white rounded-xl shadow-sm">
                <TabsTrigger value="restaurant" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <Store size={14} />
                  <span>Restaurant Profile</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <LockKeyhole size={14} />
                  <span>Account</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <Bell size={14} />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="restaurant">
                <Card className="border border-slate-200 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-slate-100">
                    <CardTitle className="text-xl bg-gradient-to-br from-purple-700 to-purple-500 text-transparent bg-clip-text">Restaurant Profile</CardTitle>
                    <CardDescription>
                      Update your restaurant details and information
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Form {...restaurantForm}>
                      <form onSubmit={restaurantForm.handleSubmit(onRestaurantSubmit)} className="space-y-4">
                        <FormField
                          control={restaurantForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Restaurant Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Restaurant Name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is how your restaurant will appear to influencers
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={restaurantForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Restaurant Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell influencers about your restaurant" 
                                  rows={4}
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a brief description of your restaurant and cuisine
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={restaurantForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main St" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={restaurantForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={restaurantForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State/Province</FormLabel>
                                <FormControl>
                                  <Input placeholder="State" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={restaurantForm.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP/Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="ZIP Code" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={restaurantForm.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://yourrestaurant.com" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="pt-4">
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Restaurant Profile"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account">
                <Card className="border border-slate-200 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-slate-100">
                    <CardTitle className="text-xl bg-gradient-to-br from-purple-700 to-purple-500 text-transparent bg-clip-text">Account Settings</CardTitle>
                    <CardDescription>
                      Update your account information and preferences
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Form {...accountForm}>
                      <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                        <FormField
                          control={accountForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="youremail@example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is the email used for important account notifications
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator className="my-6" />

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Security</h3>
                          
                          <div>
                            <Button variant="outline" type="button">
                              Change Password
                            </Button>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Would you like to delete your account?
                            </p>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" type="button">
                                  Delete Account
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove all your data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        <div className="pt-4">
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Account Settings"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="border border-slate-200 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-slate-100">
                    <CardTitle className="text-xl bg-gradient-to-br from-purple-700 to-purple-500 text-transparent bg-clip-text">Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how and when you receive notifications
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:border-purple-200 transition-all duration-200 bg-white shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive email notifications about your account activity
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-gradient-to-r from-purple-600 to-purple-500"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="submissionAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">New Submission Alerts</FormLabel>
                                <FormDescription>
                                  Get notified when influencers submit content for your campaigns
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="paymentNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Payment Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications about campaign payments and billing
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="pt-4">
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Notification Settings"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}