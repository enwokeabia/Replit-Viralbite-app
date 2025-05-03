import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { BarChart, ExternalLink, Edit2, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Submission, PrivateSubmission } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { format } from "date-fns";

type PerformanceMetric = {
  id: number;
  submissionId?: number;
  privateSubmissionId?: number;
  viewCount: number;
  likeCount: number;
  calculatedEarnings: number;
  updatedAt: string;
  updatedBy: number;
};

type SubmissionTableProps = {
  submissions: (Submission | PrivateSubmission)[];
  onUpdate: (submission: Submission | PrivateSubmission) => void;
  isPrivate: boolean;
};

export function SubmissionTable({ submissions, onUpdate, isPrivate }: SubmissionTableProps) {
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<number | null>(null);

  // Cache for user data to avoid repeated queries
  const userCache = new Map<number, User>();

  // Function to get user data for a given ID
  const getUserName = async (userId: number): Promise<string> => {
    if (userCache.has(userId)) {
      return userCache.get(userId)?.name || "Unknown";
    }
    
    try {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      if (!res.ok) return "Unknown";
      
      const user: User = await res.json();
      userCache.set(userId, user);
      return user.name;
    } catch (error) {
      console.error("Error fetching user:", error);
      return "Unknown";
    }
  };

  // Query to fetch performance history for the expanded submission
  const {
    data: performanceHistory,
    isLoading: isLoadingHistory,
  } = useQuery<PerformanceMetric[]>({
    queryKey: [
      isPrivate 
        ? `/api/admin/private-submissions/${expandedSubmissionId}/performance-history` 
        : `/api/admin/submissions/${expandedSubmissionId}/performance-history`,
      expandedSubmissionId
    ],
    queryFn: async () => {
      if (!expandedSubmissionId) return [];
      
      const endpoint = isPrivate
        ? `/api/admin/private-submissions/${expandedSubmissionId}/performance-history`
        : `/api/admin/submissions/${expandedSubmissionId}/performance-history`;
      
      const res = await apiRequest("GET", endpoint);
      if (!res.ok) throw new Error("Failed to fetch performance history");
      return res.json();
    },
    enabled: !!expandedSubmissionId,
  });

  const toggleExpandRow = (submissionId: number) => {
    setExpandedSubmissionId(expandedSubmissionId === submissionId ? null : submissionId);
  };

  // Determine campaign or invitation ID
  const getCampaignId = (submission: Submission | PrivateSubmission): number => {
    return isPrivate
      ? (submission as PrivateSubmission).invitationId
      : (submission as Submission).campaignId;
  };

  // Status badge colors
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending": return "bg-amber-100 hover:bg-amber-200 text-amber-800";
      case "approved": return "bg-green-100 hover:bg-green-200 text-green-800";
      case "rejected": return "bg-red-100 hover:bg-red-200 text-red-800";
      default: return "bg-gray-100 hover:bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="rounded-md border border-purple-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-purple-50">
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>{isPrivate ? "Invitation ID" : "Campaign ID"}</TableHead>
            <TableHead>Instagram URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Likes</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No submissions found
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((submission) => (
              <>
                <TableRow key={submission.id} className="hover:bg-purple-50">
                  <TableCell className="font-medium">{submission.id}</TableCell>
                  <TableCell>{getCampaignId(submission)}</TableCell>
                  <TableCell>
                    <a
                      href={submission.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{submission.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">{(submission as any).likes?.toLocaleString() || "N/A"}</TableCell>
                  <TableCell className="text-right font-medium">${submission.earnings.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-purple-700 border-purple-200"
                        onClick={() => toggleExpandRow(submission.id)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="sr-only">View History</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-purple-700 border-purple-200"
                        onClick={() => onUpdate(submission)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Update</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Performance History Expanded Row */}
                {expandedSubmissionId === submission.id && (
                  <TableRow className="bg-purple-50/50">
                    <TableCell colSpan={8} className="p-4">
                      <div className="rounded-md border border-purple-100 bg-white p-4">
                        <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                          <BarChart className="h-4 w-4 mr-2" />
                          Performance History
                        </h4>
                        
                        {isLoadingHistory ? (
                          <p className="text-gray-500 text-sm">Loading history...</p>
                        ) : !performanceHistory || performanceHistory.length === 0 ? (
                          <p className="text-gray-500 text-sm">No performance history available</p>
                        ) : (
                          <div className="mt-2 max-h-48 overflow-y-auto">
                            <Table>
                              <TableHeader className="bg-purple-50">
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead className="text-right">Views</TableHead>
                                  <TableHead className="text-right">Likes</TableHead>
                                  <TableHead className="text-right">Earnings</TableHead>
                                  <TableHead>Updated By</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {performanceHistory.map((metric) => (
                                  <TableRow key={metric.id}>
                                    <TableCell className="text-xs">
                                      {format(new Date(metric.updatedAt), "MMM d, yyyy h:mm a")}
                                    </TableCell>
                                    <TableCell className="text-right">{metric.viewCount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{metric.likeCount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium">${metric.calculatedEarnings.toFixed(2)}</TableCell>
                                    <TableCell>{metric.updatedBy}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}