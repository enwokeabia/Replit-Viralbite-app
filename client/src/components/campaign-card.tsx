import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash, Eye, Users } from "lucide-react";
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
import { Campaign } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CampaignApplyModal } from "./campaign-apply-modal";

interface CampaignCardProps {
  campaign: Campaign;
  viewType: "restaurant" | "influencer";
  onEdit?: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, viewType, onEdit }: CampaignCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const statusColor = {
    active: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    ended: "bg-gray-100 text-gray-800",
  };

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
      <Card className="overflow-hidden">
        <div className="h-40 bg-slate-200 relative">
          {campaign.imageUrl ? (
            <div
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url(${campaign.imageUrl})` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Trash className="h-10 w-10 text-muted" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColor[campaign.status as keyof typeof statusColor]
              }`}
            >
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">{campaign.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {campaign.description}
          </p>
          
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" /> 0 submissions
            </span>
            <span className="text-muted-foreground flex items-center">
              <Eye className="h-4 w-4 mr-1" /> 0 views
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              ${campaign.rewardAmount} per {campaign.rewardViews} views
            </span>
            
            {viewType === "restaurant" ? (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
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
                      className="text-muted-foreground hover:text-destructive"
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
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowApplyModal(true)}
                disabled={campaign.status !== "active"}
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
