import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Extended schema with validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["restaurant", "influencer"], {
    required_error: "Please select a role",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "restaurant",
    },
  });

  const handleLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        // After successful registration, login with the same credentials
        loginMutation.mutate({
          username: data.username,
          password: data.password
        });
        
        toast({
          title: "Registration successful",
          description: "You've been logged in automatically.",
          variant: "default",
        });
      }
    });
  };

  // Make emergency login a manual process with role selection 
  const handleEmergencyLogin = async (role?: string) => {
    try {
      console.log("Attempting emergency login...");
      // First, clear any previous tokens to avoid conflicts
      localStorage.removeItem("authToken");
      
      // Default to admin if no role specified
      const roleParam = role || "admin";
      
      // Call the emergency login endpoint
      const response = await fetch(`/api/emergency-login?role=${roleParam}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Emergency login successful:", data);
        
        // Store the token in localStorage
        localStorage.setItem("authToken", data.token);
        
        // Manually set the user data
        if (data.user) {
          queryClient.setQueryData(["/api/user"], data.user);
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          toast({
            title: "EMERGENCY AUTH ACTIVATED",
            description: `Logged in as ${data.user.name} (${data.user.role})`,
            variant: "default",
          });
          
          // Redirect to home page as we're now authenticated
          navigate("/");
        }
      } else {
        console.error("Emergency login failed:", await response.text());
        toast({
          title: "Emergency login failed",
          description: "Please try a regular login",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in emergency login:", error);
      toast({
        title: "Emergency login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Open emergency login dialog
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);
  
  // Clear tokens and redirect if logged in
  useEffect(() => {
    // Clear any existing tokens when loading auth page to prevent auto-login
    if (window.location.pathname === "/auth") {
      console.log("Auth page loaded, clearing tokens");
      localStorage.removeItem("authToken");
      localStorage.removeItem("testToken");
    }
    
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="bg-white p-8 rounded-lg shadow-xl border border-purple-100">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-purple-600 text-transparent bg-clip-text">ViralBite</h1>
            <p className="text-muted-foreground">
              Performance-Based Restaurant-Influencer Marketing
            </p>
          </div>

          {authMode === "login" ? (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Log in to your account</h2>
              <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="your.username"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-900 hover:to-purple-700 text-white shadow-md"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : "Log in"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  className="text-sm bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text hover:from-purple-900 hover:to-purple-700 font-medium"
                  onClick={() => setAuthMode("register")}
                >
                  Don't have an account? Sign up
                </button>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button
                    type="button" 
                    onClick={() => setShowEmergencyOptions(true)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Having trouble? Use emergency login
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Create your account</h2>
              <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Smith"
                      {...registerForm.register("name")}
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="john.smith"
                      {...registerForm.register("username")}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Select Role</Label>
                    <RadioGroup
                      value={registerForm.watch("role")}
                      onValueChange={(value) =>
                        registerForm.setValue("role", value as "restaurant" | "influencer")
                      }
                      className="grid grid-cols-2 gap-4 pt-2"
                    >
                      <div className="border rounded-lg p-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 relative shadow-sm">
                        <RadioGroupItem
                          value="restaurant"
                          id="restaurant"
                          className="absolute top-2 right-2"
                        />
                        <Label
                          htmlFor="restaurant"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-800 to-purple-600 text-white rounded-full flex items-center justify-center mb-2 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0"/><path d="M18 12v0a2 2 0 0 1-2-2v0"/><path d="M14 12v0a2 2 0 0 1-2-2v0"/><path d="M10 12v0a2 2 0 0 1-2-2v0"/><path d="M6 12v0a2 2 0 0 1-2-2v0"/><path d="M2 7v3a2 2 0 0 0 2 2v0"/></svg>
                          </div>
                          <span className="text-sm font-medium bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text">Restaurant</span>
                        </Label>
                      </div>
                      <div className="border rounded-lg p-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 relative shadow-sm">
                        <RadioGroupItem
                          value="influencer"
                          id="influencer"
                          className="absolute top-2 right-2"
                        />
                        <Label
                          htmlFor="influencer"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-full flex items-center justify-center mb-2 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          <span className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-transparent bg-clip-text">Influencer</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    {registerForm.formState.errors.role && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.role.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-900 hover:to-purple-700 text-white shadow-md"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : "Create Account"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  className="text-sm bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text hover:from-purple-900 hover:to-purple-700 font-medium"
                  onClick={() => setAuthMode("login")}
                >
                  Already have an account? Log in
                </button>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button
                    type="button" 
                    onClick={() => setShowEmergencyOptions(true)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Having trouble? Use emergency login
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <Card className="p-8 bg-gradient-to-br from-purple-900 to-purple-700 text-white hidden md:block shadow-xl">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Amplify Your Restaurant's Impact</h2>
            <p className="text-lg opacity-90">
              Connect with influencers to create performance-based marketing campaigns that drive
              real results. Track views, engagement, and calculate ROI in real-time.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-bar"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-6"/></svg>
                </div>
                <p className="text-sm opacity-90">
                  Track real-time performance metrics for all your campaigns
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <p className="text-sm opacity-90">
                  Pay only for actual views and engagement with your content
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p className="text-sm opacity-90">
                  Connect with authentic influencers who align with your brand values
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Emergency Login Dialog */}
      <Dialog open={showEmergencyOptions} onOpenChange={setShowEmergencyOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emergency Login</DialogTitle>
            <DialogDescription>
              Select a role to login as for testing purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button 
              variant="outline" 
              className="justify-start text-left font-normal"
              onClick={() => {
                handleEmergencyLogin("admin");
                setShowEmergencyOptions(false);
              }}
            >
              <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
              </div>
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-xs text-gray-500">Full access to all features</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start text-left font-normal"
              onClick={() => {
                handleEmergencyLogin("restaurant");
                setShowEmergencyOptions(false);
              }}
            >
              <div className="w-8 h-8 mr-2 bg-purple-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store text-purple-700"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0"/><path d="M18 12v0a2 2 0 0 1-2-2v0"/><path d="M14 12v0a2 2 0 0 1-2-2v0"/><path d="M10 12v0a2 2 0 0 1-2-2v0"/><path d="M6 12v0a2 2 0 0 1-2-2v0"/><path d="M2 7v3a2 2 0 0 0 2 2v0"/></svg>
              </div>
              <div>
                <div className="font-medium">Restaurant</div>
                <div className="text-xs text-gray-500">John Jones - Restaurant Owner</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start text-left font-normal"
              onClick={() => {
                handleEmergencyLogin("influencer");
                setShowEmergencyOptions(false);
              }}
            >
              <div className="w-8 h-8 mr-2 bg-pink-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-pink-700"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="font-medium">Influencer</div>
                <div className="text-xs text-gray-500">Janet - Food Influencer</div>
              </div>
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button 
              variant="ghost"
              onClick={() => setShowEmergencyOptions(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
