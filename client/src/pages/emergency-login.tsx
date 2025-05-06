import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export default function EmergencyLogin() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Local state for tokens
  const [testToken, setTestToken] = useState("");
  const [role, setRole] = useState("admin");
  const [emergency, setEmergency] = useState(true);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    // If user is already logged in, redirect to homepage
    if (user) {
      setLocation("/");
    }
    
    // Clear existing tokens from localStorage
    localStorage.removeItem("auth_token");
    
    // Set default admin token
    console.log("Set default admin token");
    setTestToken("test-token-123456");
  }, [user, setLocation]);
  
  const handleLogin = async () => {
    try {
      if (emergency) {
        // Use the emergency token mechanism
        // Add the token to localStorage
        localStorage.setItem("auth_token", testToken);
        
        // Force a page reload to ensure the token is picked up by auth hooks
        window.location.href = "/";
      } else {
        // Use the emergency login endpoint
        const response = await fetch(`/api/emergency-login?role=${role}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.token) {
          // Store the token
          localStorage.setItem("auth_token", data.token);
          setMessage(`Success! Using token: ${data.token} for user ${data.user.username}`);
          
          // Force a page reload to ensure the token is picked up by auth hooks
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Emergency login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Cleanup tokens on unmount
  useEffect(() => {
    console.log("Auth tokens cleared on auth page load");
    return () => {
      // Cleanup function, called when the component unmounts
      if (!emergency) {
        console.log("Auth tokens cleared");
        localStorage.removeItem("auth_token");
      }
    };
  }, [emergency]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 to-purple-900 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Emergency Login</CardTitle>
          <CardDescription>
            Use this page to bypass normal authentication for testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Select Role</Label>
              <Select 
                defaultValue={role} 
                onValueChange={setRole}
                disabled={emergency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="restaurant2">Restaurant 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="testToken">Auth Token</Label>
                <span className="text-xs text-gray-500">
                  <button 
                    onClick={() => setEmergency(!emergency)}
                    className="underline text-blue-500"
                  >
                    {emergency ? "Use API endpoint" : "Use direct token"}
                  </button>
                </span>
              </div>
              <Input
                id="testToken"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                disabled={!emergency}
                className="w-full"
              />
              <div className="text-xs text-gray-600">
                {emergency 
                  ? "This token will be used as auth_token in localStorage" 
                  : "Token will be fetched from the emergency login endpoint"
                }
              </div>
            </div>
            
            {message && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                {message}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
            disabled={isLoading || (emergency && !testToken)}
          >
            {isLoading ? "Loading..." : "Emergency Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}