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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bell, CreditCard, LockKeyhole } from "lucide-react";
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
import { MobileNav } from "@/components/layout/mobile-nav";

// Account settings form schema
const accountFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Notification settings form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  newCampaignAlerts: z.boolean(),
  paymentNotifications: z.boolean(),
});

// Payment settings form schema
const paymentFormSchema = z.object({
  paymentMethod: z.enum(["paypal", "bankTransfer", "venmo"]),
  paymentEmail: z.string().email("Please enter a valid email address").optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function Settings() {
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
  
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      newCampaignAlerts: true,
      paymentNotifications: true,
    },
  });
  
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "paypal",
      paymentEmail: "",
      accountName: "",
      accountNumber: "",
      routingNumber: "",
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
  
  // Handle payment form submission
  const onPaymentSubmit = async (data: PaymentFormValues) => {
    try {
      setIsSubmitting(true);
      // Mock API call - in a real app, this would update the user's payment settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Payment settings updated",
        description: "Your payment information has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your payment settings. Please try again.",
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
        <Header title="Settings" description="Manage your account settings and preferences" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <LockKeyhole size={14} />
                  <span>Account</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell size={14} />
                  <span>Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <CreditCard size={14} />
                  <span>Payment</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
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
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive email notifications about your account activity
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
                          name="newCampaignAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">New Campaign Alerts</FormLabel>
                                <FormDescription>
                                  Get notified when new campaigns matching your profile are available
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
                                  Receive notifications about your payments and earnings
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

              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Settings</CardTitle>
                    <CardDescription>
                      How and where you would like to receive your earnings
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                        <FormField
                          control={paymentForm.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Method</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="paypal">PayPal</SelectItem>
                                  <SelectItem value="bankTransfer">Bank Transfer</SelectItem>
                                  <SelectItem value="venmo">Venmo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose how you would like to receive your earnings
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {paymentForm.watch("paymentMethod") === "paypal" && (
                          <FormField
                            control={paymentForm.control}
                            name="paymentEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PayPal Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="your-paypal-email@example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                  The email address associated with your PayPal account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {paymentForm.watch("paymentMethod") === "bankTransfer" && (
                          <>
                            <FormField
                              control={paymentForm.control}
                              name="accountName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Holder Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={paymentForm.control}
                              name="accountNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123456789" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={paymentForm.control}
                              name="routingNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Routing Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="987654321" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {paymentForm.watch("paymentMethod") === "venmo" && (
                          <FormField
                            control={paymentForm.control}
                            name="paymentEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Venmo Email or Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="@venmo-username" {...field} />
                                </FormControl>
                                <FormDescription>
                                  The email or username associated with your Venmo account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="pt-4">
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Payment Settings"}
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
        
        <MobileNav />
      </div>
    </div>
  );
}