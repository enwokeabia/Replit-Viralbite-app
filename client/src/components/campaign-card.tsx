import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash, Eye, Users, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Campaign, Submission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CampaignApplyModal } from "./campaign-apply-modal";
import { useQuery } from "@tanstack/react-query";

interface CampaignCardProps {
  campaign: Campaign;
  viewType: "restaurant" | "influencer";
  onEdit?: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, viewType, onEdit }: CampaignCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Get user submissions for this campaign if in influencer view
  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
    enabled: viewType === 'influencer',
  });
  
  // Check if the influencer has already submitted to this campaign
  const userSubmission = submissions?.find(sub => sub.campaignId === campaign.id);

  // All campaigns are considered active now that the status field is removed
  const statusStyle = "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200";

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/campaigns/${campaign.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign deleted",
        description: "The campaign has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the campaign",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 hover:border-purple-200">
        <div className="h-40 bg-slate-200 relative">
          {campaign.imageUrl ? (
            <div
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url(${campaign.imageUrl})` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle}`}
            >
              Active
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-1 bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text">{campaign.title}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {campaign.description}
          </p>
          {campaign.location && (
            <div className="flex items-center mb-2 text-xs text-violet-600">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{campaign.location}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-purple-700 flex items-center">
              <Users className="h-4 w-4 mr-1 text-purple-600" /> 0 submissions
            </span>
            <span className="text-violet-700 flex items-center">
              <Eye className="h-4 w-4 mr-1 text-violet-600" /> 0 views
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center">
              <span className="mr-1 text-green-600">$</span>
              <span className="text-slate-700">{campaign.rewardAmount}</span>
              <span className="mx-1 text-slate-500">per</span>
              <span className="text-slate-700">{campaign.rewardViews}</span>
              <span className="ml-1 text-slate-500">views</span>
            </span>
            
            {viewType === "restaurant" ? (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-purple-700"
                  onClick={() => onEdit && onEdit(campaign)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit campaign</span>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete campaign</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this campaign? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-sm"
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : userSubmission ? (
              // Show submission status if the user has already applied to this campaign
              <Button
                className={
                  userSubmission.status === "approved"
                    ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm"
                    : userSubmission.status === "rejected"
                    ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-sm"
                    : "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white shadow-sm"
                }
                size="sm"
                disabled={true}
              >
                {userSubmission.status === "approved" ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Approved</>
                ) : userSubmission.status === "rejected" ? (
                  <><XCircle className="h-4 w-4 mr-1" /> Rejected</>
                ) : (
                  <><Clock className="h-4 w-4 mr-1" /> Pending</>
                )}
              </Button>
            ) : (
              // Apply button for campaigns the user hasn't applied to yet
              <Button
                className="bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-900 hover:to-purple-700 text-white shadow-sm"
                size="sm"
                onClick={() => setShowApplyModal(true)}
              >
                Apply Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {viewType === "influencer" && (
        <CampaignApplyModal
          campaign={campaign}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </>
  );
}
