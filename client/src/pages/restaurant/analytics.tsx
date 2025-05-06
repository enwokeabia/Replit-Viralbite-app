import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Campaign, Submission } from "@shared/schema";
import { Loader2, BarChart2, DollarSign } from "lucide-react";

export default function Analytics() {
  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<{
    activeCampaigns: number;
    totalCampaigns: number;
    totalSubmissions: number;
    approvedSubmissions: number;
    totalViews: number;
    totalSpent: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const isLoading = isCampaignsLoading || isSubmissionsLoading || isStatsLoading;

  // Calculate campaign performance data
  const campaignPerformance = campaigns && submissions
    ? campaigns.map(campaign => {
        const campaignSubmissions = submissions.filter(s => s.campaignId === campaign.id);
        const approvedSubmissions = campaignSubmissions.filter(s => s.status === "approved");
        const totalViews = approvedSubmissions.reduce((sum, s) => sum + s.views, 0);
        const totalEarnings = approvedSubmissions.reduce((sum, s) => sum + s.earnings, 0);
        
        return {
          id: campaign.id,
          title: campaign.title,
          status: "active", // All campaigns are now considered active
          submissions: campaignSubmissions.length,
          views: totalViews,
          earnings: totalEarnings,
          viewsPerSubmission: approvedSubmissions.length 
            ? totalViews / approvedSubmissions.length
            : 0
        };
      })
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Analytics" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
            <p className="text-slate-500">Track performance metrics for your campaigns</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">Across all campaigns</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Approved Submissions</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.approvedSubmissions || 0}</div>
                    <p className="text-xs text-muted-foreground">Out of {stats?.totalSubmissions || 0} total</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Average Views</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.approvedSubmissions 
                        ? Math.round(stats.totalViews / stats.approvedSubmissions).toLocaleString() 
                        : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Per approved submission</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats?.totalSpent?.toFixed(2) || '0.00'}</div>
                    <p className="text-xs text-muted-foreground">Based on performance</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Campaign Performance Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>View metrics for all your campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left text-sm font-medium text-muted-foreground p-2 pl-0">Campaign</th>
                          <th className="text-left text-sm font-medium text-muted-foreground p-2">Status</th>
                          <th className="text-right text-sm font-medium text-muted-foreground p-2">Submissions</th>
                          <th className="text-right text-sm font-medium text-muted-foreground p-2">Views</th>
                          <th className="text-right text-sm font-medium text-muted-foreground p-2">Avg. Views</th>
                          <th className="text-right text-sm font-medium text-muted-foreground p-2 pr-0">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignPerformance.length > 0 ? (
                          campaignPerformance.map(campaign => (
                            <tr key={campaign.id} className="border-b">
                              <td className="text-sm p-2 pl-0">{campaign.title}</td>
                              <td className="text-sm p-2 capitalize">
                                <Badge className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              </td>
                              <td className="text-sm text-right p-2">{campaign.submissions}</td>
                              <td className="text-sm text-right p-2">{campaign.views.toLocaleString()}</td>
                              <td className="text-sm text-right p-2">{Math.round(campaign.viewsPerSubmission).toLocaleString()}</td>
                              <td className="text-sm text-right p-2 pr-0">${campaign.earnings.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted-foreground">
                              No campaign data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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

function Eye({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
