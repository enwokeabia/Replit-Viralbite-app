import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignCard } from "@/components/campaign-card";
import { CampaignCreateModal } from "@/components/campaign-create-modal";
import { Campaign } from "@shared/schema";
import { Loader2, Plus, Search } from "lucide-react";

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | undefined>(undefined);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const handleCreateCampaign = () => {
    setCampaignToEdit(undefined);
    setIsCreateModalOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setCampaignToEdit(undefined);
  };

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    ? campaigns
        .filter((campaign) => {
          // Apply search filter
          if (
            searchQuery &&
            !campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          
          // Apply status filter
          if (statusFilter !== "all" && campaign.status !== statusFilter) {
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
          }
          return 0;
        })
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Campaigns" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
              <p className="text-slate-500">Create and manage your promotional campaigns</p>
            </div>
            <Button 
              className="mt-4 md:mt-0" 
              onClick={handleCreateCampaign}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Create Campaign</span>
            </Button>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search campaigns..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Campaigns List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-primary" />
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  viewType="restaurant"
                  onEdit={handleEditCampaign}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-6">
                {campaigns?.length 
                  ? "Try adjusting your filters or search query"
                  : "Create your first campaign to get started"}
              </p>
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                <span>Create Campaign</span>
              </Button>
            </div>
          )}
        </main>
        
        <MobileNav />
      </div>
      
      {/* Create/Edit Campaign Modal */}
      <CampaignCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        initialData={campaignToEdit}
      />
    </div>
  );
}

// Add an icon component for the empty state (if needed)
function Megaphone({ className }: { className?: string }) {
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
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}
