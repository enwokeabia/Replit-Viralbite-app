import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Submission, Campaign } from "@shared/schema";
import { Loader2, BarChart2, Camera, Eye, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SubmissionCard } from "@/components/submission-card";

export default function MyStats() {
  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });

  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<{
    totalSubmissions: number;
    activeSubmissions: number;
    pendingSubmissions: number;
    totalViews: number;
    totalEarnings: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const isLoading = isSubmissionsLoading || isCampaignsLoading || isStatsLoading;

  // Calculate performance metrics
  const approvedSubmissions = submissions?.filter(s => s.status === "approved") || [];
  const avgViewsPerSubmission = approvedSubmissions.length 
    ? approvedSubmissions.reduce((sum, s) => sum + s.views, 0) / approvedSubmissions.length 
    : 0;
  const viewToEarningRatio = stats?.totalViews && stats?.totalViews > 0
    ? stats.totalEarnings / stats.totalViews * 1000 // earnings per 1000 views
    : 0;

  // Calculate campaign-specific performance
  const campaignPerformance = submissions && campaigns
    ? campaigns
        .filter(campaign => submissions.some(s => s.campaignId === campaign.id))
        .map(campaign => {
          const campaignSubmissions = submissions.filter(s => s.campaignId === campaign.id);
          const approvedSubs = campaignSubmissions.filter(s => s.status === "approved");
          const totalViews = approvedSubs.reduce((sum, s) => sum + s.views, 0);
          const totalEarnings = approvedSubs.reduce((sum, s) => sum + s.earnings, 0);
          
          return {
            id: campaign.id,
            title: campaign.title,
            submissions: campaignSubmissions.length,
            approvedSubmissions: approvedSubs.length,
            views: totalViews,
            earnings: totalEarnings,
            viewsPerSubmission: approvedSubs.length ? totalViews / approvedSubs.length : 0
          };
        })
        .sort((a, b) => b.views - a.views)
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="My Stats" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">My Stats</h1>
            <p className="text-slate-500">Analyze your performance and engagement metrics</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">Across all submissions</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Earnings Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${viewToEarningRatio.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Per 1,000 views</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Campaign Performance Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>View metrics for all your campaign submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaignPerformance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left text-sm font-medium text-muted-foreground p-2 pl-0">Campaign</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2">Submissions</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2">Approved</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2">Views</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignPerformance.map(campaign => (
                            <tr key={campaign.id} className="border-b">
                              <td className="text-sm p-2 pl-0">{campaign.title}</td>
                              <td className="text-sm text-right p-2">{campaign.submissions}</td>
                              <td className="text-sm text-right p-2">{campaign.approvedSubmissions}</td>
                              <td className="text-sm text-right p-2">{campaign.views.toLocaleString()}</td>
                              <td className="text-sm text-right p-2">${campaign.earnings.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p>No submissions data available</p>
                      <Link href="/influencer/browse">
                        <Button variant="outline" className="mt-4">
                          Browse Campaigns
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Submissions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Submissions</CardTitle>
                    <CardDescription>Your content and its current status</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {submissions && submissions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {submissions.slice(0, 4).map(submission => {
                        const campaign = campaigns?.find(c => c.id === submission.campaignId);
                        return (
                          <SubmissionCard
                            key={submission.id}
                            submission={submission}
                            campaignTitle={campaign?.title || "Unknown Campaign"}
                            restaurantView={false}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No submissions yet</p>
                      <Link href="/influencer/browse">
                        <Button variant="outline" className="mt-4">
                          Find Campaigns
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
