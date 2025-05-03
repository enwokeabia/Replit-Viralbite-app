import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { AuthProvider } from "@/hooks/use-auth";

// Influencer pages
import InfluencerDashboard from "@/pages/influencer/dashboard";
import BrowseCampaigns from "@/pages/influencer/browse";
import MyStats from "@/pages/influencer/my-stats";
import Earnings from "@/pages/influencer/earnings";
import Profile from "@/pages/influencer/profile";
import Settings from "@/pages/influencer/settings";
import InfluencerPrivateInvitations from "@/pages/influencer/private-invitations";

// Restaurant pages
import RestaurantDashboard from "@/pages/restaurant/dashboard";
import Campaigns from "@/pages/restaurant/campaigns";
import Submissions from "@/pages/restaurant/submissions";
import Analytics from "@/pages/restaurant/analytics";
import RestaurantPrivateInvitations from "@/pages/restaurant/private-invitations";
import RestaurantSettings from "@/pages/restaurant/settings";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLogin from "@/pages/admin/login";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Restaurant Routes */}
      <ProtectedRoute path="/restaurant/dashboard" component={RestaurantDashboard} />
      <ProtectedRoute path="/restaurant/campaigns" component={Campaigns} />
      <ProtectedRoute path="/restaurant/submissions" component={Submissions} />
      <ProtectedRoute path="/restaurant/analytics" component={Analytics} />
      <ProtectedRoute path="/restaurant/private-invitations" component={RestaurantPrivateInvitations} />
      <ProtectedRoute path="/restaurant/settings" component={RestaurantSettings} />
      
      {/* Influencer Routes */}
      <ProtectedRoute path="/influencer/dashboard" component={InfluencerDashboard} />
      <ProtectedRoute path="/influencer/browse" component={BrowseCampaigns} />
      <ProtectedRoute path="/influencer/stats" component={Earnings} />
      <ProtectedRoute path="/influencer/profile" component={Profile} />
      <ProtectedRoute path="/influencer/settings" component={Settings} />
      <ProtectedRoute path="/influencer/private-invitations" component={InfluencerPrivateInvitations} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <AdminProtectedRoute path="/admin" component={AdminDashboard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
