import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmissionCard } from "@/components/submission-card";
import { Submission, Campaign } from "@shared/schema";
import { Loader2, Search, ClipboardList } from "lucide-react";

export default function Submissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });

  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const isLoading = isSubmissionsLoading || isCampaignsLoading;

  // Filter and sort submissions
  const filteredSubmissions = submissions && campaigns
    ? submissions
        .filter((submission) => {
          // Find the related campaign for search
          const campaign = campaigns.find(c => c.id === submission.campaignId);
          
          // Apply search filter
          if (
            searchQuery &&
            !campaign?.title.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          
          // Apply status filter
          if (statusFilter !== "all" && submission.status !== statusFilter) {
            return false;
          }
          
          return true;
        })
        .sort((a, b) => {
          // Apply sorting
          if (sortBy === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortBy === "oldest") {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          } else if (sortBy === "most_views") {
            return b.views - a.views;
          }
          return 0;
        })
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Submissions" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Submissions</h1>
            <p className="text-slate-500">Manage and review content submissions from influencers</p>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by campaign..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-40">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-40">
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="most_views">Most Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Submissions List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-primary" />
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubmissions.map((submission) => {
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
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {submissions?.length 
                  ? "Try adjusting your filters or search query"
                  : "You haven't received any submissions yet"}
              </p>
            </div>
          )}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
