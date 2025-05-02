import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Submission, Campaign } from "@shared/schema";
import { Loader2, DollarSign, ArrowUpRight, TrendingUp, LineChart, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

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

  // Calculate earnings metrics
  const approvedSubmissions = submissions?.filter(s => s.status === "approved") || [];
  
  // Sort submissions by earnings (descending) and get top 5
  const topEarningSubmissions = [...(approvedSubmissions || [])]
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);
  
  // Calculate total potential earnings (including pending submissions)
  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const potentialEarnings = pendingSubmissions.reduce((sum, s) => {
    const campaign = campaigns?.find(c => c.id === s.campaignId);
    // Assume average views for potential calculations
    const potentialViews = approvedSubmissions.length 
      ? approvedSubmissions.reduce((sum, s) => sum + s.views, 0) / approvedSubmissions.length
      : 5000; // Fallback to 5000 if no approved submissions
    
    if (!campaign) return sum;
    return sum + (potentialViews / campaign.rewardViews) * campaign.rewardAmount;
  }, 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Earnings" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Earnings</h1>
            <p className="text-slate-500">Track your performance-based income from all campaigns</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Main Earnings Card */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                          <h3 className="text-4xl font-bold mt-1">${stats?.totalEarnings?.toFixed(2) || '0.00'}</h3>
                        </div>
                        
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm font-medium">Earnings Overview</p>
                      <div className="space-y-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Approved Submissions</span>
                          <span className="font-medium">{approvedSubmissions.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Views</span>
                          <span className="font-medium">{stats?.totalViews?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pending Submissions</span>
                          <span className="font-medium">{pendingSubmissions.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
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
                        <Button variant="outline" className="mt-4">
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
