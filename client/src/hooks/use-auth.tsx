import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Try token-based auth first as an emergency fallback
      try {
        console.log("Attempting token-based authentication");
        const tokenRes = await apiRequest("POST", "/api/auth/token", credentials);
        const tokenData = await tokenRes.json();
        
        // Store the auth token in localStorage
        localStorage.setItem("authToken", tokenData.token);
        
        // Set the auth token for all future requests
        console.log("Saved auth token to localStorage");
        
        return tokenData.user;
      } catch (tokenError) {
        console.error("Token auth failed, falling back to session auth:", tokenError);
        // Fall back to session-based auth if token auth fails
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear the auth token from localStorage
      localStorage.removeItem("authToken");
      console.log("Removed auth token from localStorage");
      
      try {
        // Also attempt to log out from session-based auth
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        // Ignore errors from logout API call
        console.log("Session logout API error (ignoring):", error);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      // Still clear the user data even if logout fails
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logout may not be complete",
        description: "Your session has been cleared locally, but the server reported an error: " + error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
