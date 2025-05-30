import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { CircleCheckBig, Database, Loader2, LogOut, ListFilter, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { PerformanceUpdateModal } from "@/components/admin/performance-update-modal";
import { SubmissionTable } from "@/components/admin/submission-table";
import { Submission, PrivateSubmission, Campaign } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedPrivateSubmission, setSelectedPrivateSubmission] = useState<PrivateSubmission | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  // Query to fetch all campaigns
  const {
    data: campaigns,
    isLoading: isLoadingCampaigns,
    isError: isErrorCampaigns,
  } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  // Query to fetch all submissions
  const {
    data: submissions,
    isLoading: isLoadingSubmissions,
    isError: isErrorSubmissions,
  } = useQuery<Submission[]>({
    queryKey: ["/api/admin/submissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/submissions");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  // Query to fetch all private submissions
  const {
    data: privateSubmissions,
    isLoading: isLoadingPrivateSubmissions,
    isError: isErrorPrivateSubmissions,
  } = useQuery<PrivateSubmission[]>({
    queryKey: ["/api/admin/private-submissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/private-submissions");
      if (!res.ok) throw new Error("Failed to fetch private submissions");
      return res.json();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/admin/login");
        toast({
          title: "Logged out",
          description: "You have been logged out of the admin portal.",
        });
      },
    });
  };

  const handleOpenUpdateModal = (submission: Submission | PrivateSubmission, isPrivate: boolean) => {
    if (isPrivate) {
      setSelectedPrivateSubmission(submission as PrivateSubmission);
      setSelectedSubmission(null);
    } else {
      setSelectedSubmission(submission as Submission);
      setSelectedPrivateSubmission(null);
    }
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedSubmission(null);
    setSelectedPrivateSubmission(null);
  };

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/private-submissions"] });
    toast({
      title: "Performance updated",
      description: "The performance metrics have been updated successfully.",
      variant: "default",
    });
    setIsUpdateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="bg-gradient-to-r from-purple-700 to-purple-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">ViralBite Admin Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Logged in as <strong>{user?.name}</strong>
            </span>
            <Button 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-6xl">
        <div className="my-8">
          <h2 className="text-2xl font-bold mb-6 text-purple-800">Performance Metrics Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-purple-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-purple-700">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingCampaigns ? (
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  ) : (
                    campaigns?.length || 0
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-purple-700">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingSubmissions || isLoadingPrivateSubmissions ? (
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  ) : (
                    (submissions?.length || 0) + (privateSubmissions?.length || 0)
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-purple-700">Total Influencers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoadingSubmissions ? (
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  ) : (
                    new Set(submissions?.map(s => s.influencerId)).size || 0
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="campaigns" className="flex items-center">
                <ListFilter className="h-4 w-4 mr-2" />
                All Campaigns
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Public Submissions
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center">
                <CircleCheckBig className="h-4 w-4 mr-2" />
                Private Submissions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="space-y-4">
              {isLoadingCampaigns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : isErrorCampaigns ? (
                <div className="text-center py-8 text-red-500">
                  Error loading campaigns. Please try again.
                </div>
              ) : (
                <div className="rounded-md border border-purple-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-50">
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns && campaigns.length > 0 ? (
                        campaigns.map((campaign) => (
                          <TableRow key={campaign.id} className="hover:bg-purple-50">
                            <TableCell className="font-medium">{campaign.id}</TableCell>
                            <TableCell>{campaign.title}</TableCell>
                            <TableCell>{campaign.restaurantId}</TableCell>
                            <TableCell>
                              <Badge
                                className="bg-green-100 text-green-800"
                              >
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>${campaign.rewardAmount} per {campaign.rewardViews} views</TableCell>
                            <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No campaigns found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="public" className="space-y-4">
              {isLoadingSubmissions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : isErrorSubmissions ? (
                <div className="text-center py-8 text-red-500">
                  Error loading submissions. Please try again.
                </div>
              ) : (
                <SubmissionTable 
                  submissions={submissions || []} 
                  onUpdate={(submission) => handleOpenUpdateModal(submission, false)}
                  isPrivate={false}
                />
              )}
            </TabsContent>
            
            <TabsContent value="private" className="space-y-4">
              {isLoadingPrivateSubmissions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : isErrorPrivateSubmissions ? (
                <div className="text-center py-8 text-red-500">
                  Error loading private submissions. Please try again.
                </div>
              ) : (
                <SubmissionTable 
                  submissions={privateSubmissions || []} 
                  onUpdate={(submission) => handleOpenUpdateModal(submission, true)}
                  isPrivate={true}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Performance Update Modal */}
      {isUpdateModalOpen && (
        <PerformanceUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={handleCloseUpdateModal}
          submission={selectedSubmission}
          privateSubmission={selectedPrivateSubmission}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}