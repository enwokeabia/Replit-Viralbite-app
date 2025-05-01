import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role === "restaurant") {
        navigate("/restaurant/dashboard");
      } else if (user.role === "influencer") {
        navigate("/influencer/dashboard");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  // Return an empty div to satisfy the type requirement for React element
  return <div className="hidden"></div>;
}
