import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Submission, Campaign } from "@shared/schema";
import { Loader2, DollarSign, TrendingUp, Eye, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SubmissionCard } from "@/components/submission-card";

// Helper function to format date
function formatDate(dateString: string | Date) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function Earnings() {
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
  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const viewToEarningRatio = stats?.totalViews && stats?.totalViews > 0
    ? stats.totalEarnings / stats.totalViews * 1000 // earnings per 1000 views
    : 0;
  
  // Sort submissions by earnings (descending) and get top 5
  const topEarningSubmissions = [...(approvedSubmissions || [])]
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);
  
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
        .sort((a, b) => b.earnings - a.views)
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Earnings & Stats" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Earnings & Stats</h1>
            <p className="text-slate-500">Track your performance and earnings from all campaigns</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Total Earnings</CardTitle>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${stats?.totalEarnings?.toFixed(2) || '0.00'}</div>
                    <p className="text-sm text-muted-foreground">Based on {approvedSubmissions.length} approved submissions</p>
                  </CardContent>
                </Card>
                
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
              
              {/* Top Earning Submissions */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Top Earning Submissions</CardTitle>
                  <CardDescription>Your best performing content by earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {topEarningSubmissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left text-sm font-medium text-muted-foreground p-2 pl-0">Campaign</th>
                            <th className="text-left text-sm font-medium text-muted-foreground p-2">Submitted</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2">Views</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2">Rate</th>
                            <th className="text-right text-sm font-medium text-muted-foreground p-2 pr-0">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topEarningSubmissions.map(submission => {
                            const campaign = campaigns?.find(c => c.id === submission.campaignId);
                            const rate = campaign 
                              ? `$${campaign.rewardAmount}/${campaign.rewardViews.toLocaleString()}`
                              : "Unknown";
                            
                            return (
                              <tr key={submission.id} className="border-b">
                                <td className="text-sm p-2 pl-0 font-medium">
                                  {campaign?.title || "Unknown Campaign"}
                                </td>
                                <td className="text-sm p-2 text-muted-foreground">
                                  {formatDate(submission.createdAt)}
                                </td>
                                <td className="text-sm text-right p-2">
                                  {submission.views.toLocaleString()}
                                </td>
                                <td className="text-sm text-right p-2 text-muted-foreground">
                                  {rate}
                                </td>
                                <td className="text-sm text-right p-2 pr-0 font-medium text-green-600">
                                  ${submission.earnings.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p>No earnings data available yet</p>
                      <p className="text-sm mt-1">Submit your first campaign to start earning</p>
                      <Link href="/influencer/browse">
                        <Button className="mt-4 bg-purple-700 hover:bg-purple-800 text-white">
                          Browse Campaigns
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
              
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
                        <Button className="mt-4 bg-purple-700 hover:bg-purple-800 text-white">
                          Browse Campaigns
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
