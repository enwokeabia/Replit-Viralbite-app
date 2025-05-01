import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatsCard } from "@/components/stats-card";
import { Loader2, Camera, Eye, DollarSign } from "lucide-react";
import { Submission, Campaign } from "@shared/schema";
import { SubmissionCard } from "@/components/submission-card";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function InfluencerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useQuery<{
    totalSubmissions: number;
    activeSubmissions: number;
    pendingSubmissions: number;
    totalViews: number;
    totalEarnings: number;
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

  // Get top performing content based on views
  const topContent = submissions && campaigns
    ? submissions
        .filter(s => s.status === "approved")
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map(submission => {
          const campaign = campaigns.find(c => c.id === submission.campaignId);
          return { submission, campaign };
        })
    : [];

  // Get recommended campaigns - active campaigns that the user hasn't submitted to yet
  const recommendedCampaigns = campaigns && submissions
    ? campaigns
        .filter(c => 
          c.status === "active" && 
          !submissions.some(s => s.campaignId === c.id && s.influencerId === user?.id)
        )
        .slice(0, 3)
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Dashboard" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500">Track your performance and earnings</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                  title="Active Submissions"
                  value={stats?.activeSubmissions || 0}
                  icon={<Camera className="h-5 w-5 text-accent" />}
                  trend={{
                    value: `${stats?.pendingSubmissions || 0} pending`,
                    positive: true,
                  }}
                />
                
                <StatsCard
                  title="Total Views"
                  value={stats?.totalViews?.toLocaleString() || 0}
                  icon={<Eye className="h-5 w-5 text-secondary-500" />}
                  trend={{
                    value: "Across all content",
                    positive: true,
                  }}
                />
                
                <StatsCard
                  title="Total Earnings"
                  value={`$${stats?.totalEarnings?.toFixed(2) || '0.00'}`}
                  icon={<DollarSign className="h-5 w-5 text-green-600" />}
                  trend={{
                    value: "Based on views",
                    positive: true,
                  }}
                />
              </div>
              
              {/* Top Performing Content and Recommended Opportunities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Your Top Content</CardTitle>
                      <CardDescription>Best performing submissions based on views</CardDescription>
                    </div>
                    <Link href="/influencer/stats">
                      <Button variant="default" size="sm" className="text-sm">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {topContent.length > 0 ? (
                      <div className="space-y-3">
                        {topContent.map(({ submission, campaign }) => (
                          <div key={submission.id} className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                            <div className="w-16 h-16 rounded-md bg-slate-200 flex-shrink-0 mr-3 overflow-hidden">
                              {campaign?.imageUrl ? (
                                <img 
                                  src={campaign.imageUrl} 
                                  alt={campaign?.title} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                                  <Camera className="h-6 w-6 text-accent/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">{campaign?.title || "Untitled Campaign"}</p>
                              <p className="text-sm text-slate-500 truncate">
                                {new Date(submission.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-slate-500 mr-3">
                                  <Eye className="inline h-3 w-3 mr-1" /> {submission.views.toLocaleString()} views
                                </span>
                                <span className="text-xs text-green-600">
                                  <DollarSign className="inline h-3 w-3 mr-1" /> ${submission.earnings.toFixed(2)} earned
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p>No approved submissions yet</p>
                        <p className="text-sm mt-1">Create your first submission to see performance</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Recommended Opportunities</CardTitle>
                      <CardDescription>Campaigns that match your profile</CardDescription>
                    </div>
                    <Link href="/influencer/browse">
                      <Button variant="default" size="sm" className="text-sm">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recommendedCampaigns.length > 0 ? (
                      <div className="space-y-3">
                        {recommendedCampaigns.map(campaign => (
                          <div key={campaign.id} className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                            <div className="w-16 h-16 rounded-md bg-slate-200 flex-shrink-0 mr-3 overflow-hidden">
                              {campaign.imageUrl ? (
                                <img 
                                  src={campaign.imageUrl} 
                                  alt={campaign.title} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                                  <Camera className="h-6 w-6 text-accent/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">{campaign.title}</p>
                              <p className="text-sm text-slate-500 truncate">{campaign.description}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-green-600">
                                  <DollarSign className="inline h-3 w-3 mr-1" /> ${campaign.rewardAmount} per {campaign.rewardViews.toLocaleString()} views
                                </span>
                              </div>
                            </div>
                            <Link href={`/influencer/browse?highlight=${campaign.id}`}>
                              <Button variant="default" size="sm">
                                Apply
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No recommended campaigns available</p>
                        <Link href="/influencer/browse">
                          <Button variant="outline" className="mt-4">
                            Browse All Campaigns
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
