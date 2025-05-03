import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, DollarSign, ThumbsUp } from "lucide-react";
import { Submission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubmissionCardProps {
  submission: Submission;
  campaignTitle: string;
  influencerName?: string;
  restaurantView?: boolean;
}

export function SubmissionCard({
  submission,
  campaignTitle,
  influencerName,
  restaurantView = false,
}: SubmissionCardProps) {
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingViews, setIsUpdatingViews] = useState(false);
  const [viewCount, setViewCount] = useState(submission.views);
  const [likeCount, setLikeCount] = useState(submission.likes || 0);

  const statusColors = {
    pending: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200",
    approved: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200",
    rejected: "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200",
  };

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    try {
      setIsUpdatingStatus(true);
      await apiRequest("PUT", `/api/submissions/${submission.id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Status updated",
        description: `Submission ${status} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewsUpdate = async () => {
    try {
      setIsUpdatingViews(true);
      await apiRequest("PUT", `/api/submissions/${submission.id}/views`, { 
        views: viewCount,
        likes: likeCount
      });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Stats updated",
        description: "Views, likes, and earnings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update engagement stats",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingViews(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold bg-gradient-to-r from-purple-800 to-purple-600 text-transparent bg-clip-text">{campaignTitle}</h3>
          <Badge
            variant="outline"
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[submission.status as keyof typeof statusColors]
            }`}
          >
            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </Badge>
        </div>

        {influencerName && (
          <p className="text-sm text-muted-foreground mb-3">
            By {influencerName}
          </p>
        )}

        <div className="text-sm mb-3">
          <a
            href={submission.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate block"
          >
            {submission.instagramUrl}
          </a>
        </div>

        {submission.notes && (
          <p className="text-sm text-muted-foreground mb-3 italic">
            "{submission.notes}"
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground mr-3">
            <Eye className="h-4 w-4 mr-1" /> {submission.views.toLocaleString()} views
          </div>
          <div className="flex items-center text-sm text-violet-600 mr-3">
            <ThumbsUp className="h-4 w-4 mr-1" /> {(submission.likes || 0).toLocaleString()} likes
          </div>
          {submission.earnings > 0 && (
            <div className="flex items-center text-sm text-green-600">
              <DollarSign className="h-4 w-4 mr-1" /> ${submission.earnings.toFixed(2)} earned
            </div>
          )}
        </div>

        {restaurantView && submission.status === "pending" && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={isUpdatingStatus}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm"
              onClick={() => handleStatusUpdate("approved")}
              disabled={isUpdatingStatus}
            >
              Approve
            </Button>
          </div>
        )}

        {restaurantView && submission.status === "approved" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full text-purple-800 hover:bg-purple-50 border-purple-200 hover:text-purple-900">
                Update Engagement
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update Engagement Stats</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter the current view and like counts for this submission
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="view-count">View Count</Label>
                  <Input
                    id="view-count"
                    type="number"
                    min={0}
                    value={viewCount}
                    onChange={(e) => setViewCount(parseInt(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="like-count">Like Count</Label>
                  <Input
                    id="like-count"
                    type="number"
                    min={0}
                    value={likeCount}
                    onChange={(e) => setLikeCount(parseInt(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleViewsUpdate}
                  disabled={isUpdatingViews}
                  className="bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-900 hover:to-purple-700 text-white"
                >
                  {isUpdatingViews ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : "Update"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
