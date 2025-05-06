import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Campaign, Submission } from "@shared/schema";
import { Loader2, Search, Filter, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Categories for campaigns (for filtering)
const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "sustainability", label: "Sustainability" },
  { value: "local", label: "Local Sourcing" },
  { value: "community", label: "Community" }
];

export default function BrowseCampaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("highest");
  const [location] = useLocation();
  
  // Extract highlighted campaign ID from URL if any
  const urlParams = new URLSearchParams(
    location.includes("?") ? location.substring(location.indexOf("?")) : ""
  );
  const highlightCampaignId = urlParams.get("highlight");
  
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  // Get submissions for current user
  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    ? campaigns
        .filter((campaign) => {
          // Apply search filter if one exists
          if (searchQuery &&
            !campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          
          // Apply category filter - in a real app this would be based on actual category data
          if (categoryFilter !== "all") {
            // This is a simplified category check based on keywords in the title/description
            if (categoryFilter === "sustainability" && 
                !(campaign.title.toLowerCase().includes("sustainability") || 
                  campaign.description.toLowerCase().includes("eco") ||
                  campaign.description.toLowerCase().includes("sustainable"))) {
              return false;
            }
            if (categoryFilter === "local" && 
                !(campaign.title.toLowerCase().includes("local") || 
                  campaign.description.toLowerCase().includes("local") ||
                  campaign.description.toLowerCase().includes("sourcing"))) {
              return false;
            }
            if (categoryFilter === "community" && 
                !(campaign.title.toLowerCase().includes("community") || 
                  campaign.description.toLowerCase().includes("community"))) {
              return false;
            }
          }
          
          return true;
        })
        .sort((a, b) => {
          // Apply sorting
          if (sortBy === "highest") {
            return b.rewardAmount / b.rewardViews - a.rewardAmount / a.rewardViews;
          } else if (sortBy === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return 0;
        })
    : [];
    
  // Scroll to highlighted campaign if needed
  useEffect(() => {
    if (highlightCampaignId && !isLoading) {
      const element = document.getElementById(`campaign-${highlightCampaignId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('ring-2', 'ring-accent', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-accent', 'ring-offset-2');
        }, 2000);
      }
    }
  }, [highlightCampaignId, isLoading, campaigns]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Browse Campaigns" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Browse Campaigns</h1>
            <p className="text-slate-500">Find campaigns that match your style and audience</p>
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
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="highest">Highest Paying</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Campaigns Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={30} className="animate-spin text-accent" />
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign) => (
                <div id={`campaign-${campaign.id}`} key={campaign.id} className="transition-all duration-300">
                  <CampaignCard
                    campaign={campaign}
                    viewType="influencer"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {campaigns && campaigns.length > 0
                  ? "Try adjusting your filters or search query"
                  : "There are no campaigns available at the moment"}
              </p>
              {categoryFilter !== "all" && (
                <Button variant="outline" onClick={() => setCategoryFilter("all")}>
                  Clear Category Filter
                </Button>
              )}
            </div>
          )}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
