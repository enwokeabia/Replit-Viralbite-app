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
    registerMutation.mutate(data);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 text-transparent bg-clip-text">ViralBite</h1>
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
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Log in"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setAuthMode("register")}
                >
                  Don't have an account? Sign up
                </button>
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
                      <div className="border rounded-lg p-4 cursor-pointer hover:border-primary relative">
                        <RadioGroupItem
                          value="restaurant"
                          id="restaurant"
                          className="absolute top-2 right-2"
                        />
                        <Label
                          htmlFor="restaurant"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0"/><path d="M18 12v0a2 2 0 0 1-2-2v0"/><path d="M14 12v0a2 2 0 0 1-2-2v0"/><path d="M10 12v0a2 2 0 0 1-2-2v0"/><path d="M6 12v0a2 2 0 0 1-2-2v0"/><path d="M2 7v3a2 2 0 0 0 2 2v0"/></svg>
                          </div>
                          <span className="text-sm font-medium">Restaurant</span>
                        </Label>
                      </div>
                      <div className="border rounded-lg p-4 cursor-pointer hover:border-primary relative">
                        <RadioGroupItem
                          value="influencer"
                          id="influencer"
                          className="absolute top-2 right-2"
                        />
                        <Label
                          htmlFor="influencer"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          <span className="text-sm font-medium">Influencer</span>
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
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setAuthMode("login")}
                >
                  Already have an account? Log in
                </button>
              </div>
            </>
          )}
        </div>

        <Card className="p-8 bg-gradient-to-br from-purple-800 to-purple-600 text-white hidden md:block">
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
    </div>
  );
}
