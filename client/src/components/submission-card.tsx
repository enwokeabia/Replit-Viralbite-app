import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, DollarSign, ThumbsUp, MessageSquare } from "lucide-react";
import { Submission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
// Alert dialog imports removed as they're no longer needed

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

  // Removed handleViewsUpdate function - only admins should be able to update metrics

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-slate-200 hover:border-purple-200">
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
          <div className="flex items-center mb-3">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold mr-2">
              {influencerName.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium text-slate-700">
              By <span className="text-purple-700">{influencerName}</span>
            </p>
          </div>
        )}

        <div className="flex items-center mb-3 p-2 bg-gradient-to-r from-purple-50 to-transparent rounded-md border border-purple-100">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-pink-600 mr-2"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <a
            href={submission.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-700 hover:text-purple-900 hover:underline truncate flex-1"
          >
            {submission.instagramUrl}
          </a>
        </div>

        {submission.notes && (
          <div className="flex items-start mb-3 rounded-md p-2 bg-slate-50 border border-slate-100">
            <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-slate-600 italic">
              "{submission.notes}"
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-full px-3 py-1 flex items-center">
            <Eye className="h-4 w-4 mr-1.5 text-purple-600" /> 
            <span className="text-sm font-medium text-purple-800">{submission.views.toLocaleString()}</span>
            <span className="text-xs text-purple-600 ml-1">views</span>
          </div>
          
          <div className="bg-gradient-to-r from-violet-50 to-transparent rounded-full px-3 py-1 flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1.5 text-violet-600" /> 
            <span className="text-sm font-medium text-violet-800">{(submission.likes || 0).toLocaleString()}</span>
            <span className="text-xs text-violet-600 ml-1">likes</span>
          </div>
          
          {submission.earnings > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-transparent rounded-full px-3 py-1 flex items-center">
              <DollarSign className="h-4 w-4 mr-1.5 text-green-600" /> 
              <span className="text-sm font-medium text-green-800">${submission.earnings.toFixed(2)}</span>
              <span className="text-xs text-green-600 ml-1">earned</span>
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
              {isUpdatingStatus ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rejecting...
                </>
              ) : "Reject"}
            </Button>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm"
              onClick={() => handleStatusUpdate("approved")}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving...
                </>
              ) : "Approve"}
            </Button>
          </div>
        )}

        {/* Removed restaurant's ability to update engagement metrics - only admins can update now */}
      </CardContent>
    </Card>
  );
}
