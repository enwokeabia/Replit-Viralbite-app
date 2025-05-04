import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Build headers with content type if there's data
  const headers: Record<string, string> = data 
    ? { "Content-Type": "application/json" } 
    : {};
  
  // Add auth token if available
  const authToken = localStorage.getItem("authToken");
  const testToken = localStorage.getItem("testToken");
  
  // Try the primary token first
  if (authToken) {
    headers["x-auth-token"] = authToken;
    console.log("Adding auth token to POST request:", authToken);
  } 
  // Fallback to the test token if no primary token exists
  else if (testToken) {
    headers["x-auth-token"] = testToken;
    console.log("Adding TEST token to POST request:", testToken);
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Still include credentials for cookies
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Include auth token if available
    const headers: Record<string, string> = {};
    const authToken = localStorage.getItem("authToken");
    const testToken = localStorage.getItem("testToken");
    
    // Try the primary token first
    if (authToken) {
      headers["x-auth-token"] = authToken;
      console.log("Adding auth token to GET request:", authToken);
    } 
    // Fallback to the test token if no primary token exists
    else if (testToken) {
      headers["x-auth-token"] = testToken;
      console.log("Adding TEST token to GET request:", testToken);
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper functions for auth token management
export function setAuthToken(token: string) {
  localStorage.setItem("authToken", token);
  console.log("Auth token stored:", token);
}

export function getStoredAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

export function setTestToken(token: string) {
  localStorage.setItem("testToken", token);
  console.log("Test token stored:", token);
}

export function clearTokens() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("testToken");
  console.log("Auth tokens cleared");
}

// For quick testing, set a default token based on the role
export function setDefaultToken(role: "admin" | "restaurant" | "influencer" = "admin") {
  const tokens = {
    admin: "test-token-123456",
    restaurant: "test-restaurant-token",
    influencer: "test-influencer-token"
  };
  
  // Clear any existing tokens first
  clearTokens();
  
  // Set the test token for the specified role
  setTestToken(tokens[role]);
  console.log(`Default ${role} token set:`, tokens[role]);
}

// Initialize default token if one doesn't exist already
// This ensures we always have some form of auth during development
export function initializeAuthToken() {
  const existingToken = localStorage.getItem("authToken") || localStorage.getItem("testToken");
  if (!existingToken) {
    console.log("No auth token found, setting default admin token");
    setDefaultToken("admin");
  }
}
