import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, DollarSign } from "lucide-react";
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

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
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
      await apiRequest("PUT", `/api/submissions/${submission.id}/views`, { views: viewCount });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Views updated",
        description: "Submission views and earnings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update views",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingViews(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{campaignTitle}</h3>
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

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Eye className="h-4 w-4 mr-1" /> {submission.views} views
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
              className="w-full"
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
              <Button size="sm" variant="outline" className="w-full">
                Update Views
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update View Count</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter the current view count for this submission
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
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
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleViewsUpdate}
                  disabled={isUpdatingViews}
                >
                  {isUpdatingViews ? "Updating..." : "Update"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
