import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatsCard } from "@/components/stats-card";
import { Loader2, Megaphone, ClipboardList, Eye, DollarSign, ThumbsUp } from "lucide-react";
import { Submission, Campaign } from "@shared/schema";
import { SubmissionCard } from "@/components/submission-card";
import { useAuth } from "@/hooks/use-auth";

export default function RestaurantDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useQuery<{
    activeCampaigns: number;
    totalCampaigns: number;
    totalSubmissions: number;
    approvedSubmissions: number;
    totalViews: number;
    totalLikes: number;
    totalSpent: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });

  const isLoading = isStatsLoading || isCampaignsLoading || isSubmissionsLoading;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Dashboard" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500">Overview of your campaigns and performance</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                <StatsCard
                  title="Active Campaigns"
                  value={stats?.activeCampaigns || 0}
                  icon={<Megaphone className="h-5 w-5 text-primary" />}
                  trend={{
                    value: "New this month",
                    positive: true,
                  }}
                />
                
                <StatsCard
                  title="Total Submissions"
                  value={stats?.totalSubmissions || 0}
                  icon={<ClipboardList className="h-5 w-5 text-secondary-500" />}
                  trend={{
                    value: `${stats?.approvedSubmissions || 0} approved`,
                    positive: true,
                  }}
                />
                
                <StatsCard
                  title="Total Views"
                  value={stats?.totalViews?.toLocaleString() || 0}
                  icon={<Eye className="h-5 w-5 text-accent" />}
                  trend={{
                    value: "Across all campaigns",
                    positive: true,
                  }}
                />
                
                <StatsCard
                  title="Total Likes"
                  value={stats?.totalLikes?.toLocaleString() || 0}
                  icon={<ThumbsUp className="h-5 w-5 text-violet-600" />}
                  trend={{
                    value: "From all content",
                    positive: true,
                  }}
                />
                
                <StatsCard
                  title="Total Spent"
                  value={`$${stats?.totalSpent?.toFixed(2) || '0.00'}`}
                  icon={<DollarSign className="h-5 w-5 text-green-600" />}
                  trend={{
                    value: "Based on views",
                    positive: true,
                  }}
                />
              </div>
              
              {/* Recent Submissions */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Recent Submissions</h2>
                </div>
                
                {submissions && submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.slice(0, 6).map((submission) => {
                      const campaign = campaigns?.find(c => c.id === submission.campaignId);
                      return (
                        <SubmissionCard 
                          key={submission.id}
                          submission={submission}
                          campaignTitle={campaign?.title || "Unknown Campaign"}
                          restaurantView={true}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No submissions yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
