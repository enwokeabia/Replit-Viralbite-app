import { useState } from "react";
import { type PrivateInvitation } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clipboard,
  Check,
  X,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrivateInvitationCardProps {
  invitation: PrivateInvitation;
  viewType: "restaurant" | "influencer";
  onDelete?: () => void;
}

export function PrivateInvitationCard({
  invitation,
  viewType,
  onDelete,
}: PrivateInvitationCardProps) {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isRestaurantView = viewType === "restaurant";

  // Status badge styling
  const statusConfig = {
    pending: {
      label: "Pending",
      variant: "outline" as const,
    },
    accepted: {
      label: "Accepted",
      variant: "secondary" as const,
    },
    declined: {
      label: "Declined",
      variant: "destructive" as const,
    },
    completed: {
      label: "Completed",
      variant: "default" as const,
    },
  };

  // Invitation code handling
  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitation.inviteCode);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Invitation code copied successfully.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Update invitation status mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (status: "accepted" | "declined") => {
      const res = await apiRequest("PATCH", `/api/private-invitations/${invitation.id}`, {
        status,
      });
      if (!res.ok) throw new Error(`Failed to ${status} invitation`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/private-invitations"] });
      toast({
        title: data.status === "accepted" ? "Invitation accepted" : "Invitation declined",
        description: data.status === "accepted" 
          ? "You have accepted this invitation. You can now submit content."
          : "You have declined this invitation.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle accept/decline actions for influencer
  const handleAccept = () => {
    updateStatusMutation.mutate("accepted");
  };

  const handleDecline = () => {
    updateStatusMutation.mutate("declined");
  };

  // Render card based on viewType and invitation status
  const renderFooter = () => {
    if (isRestaurantView) {
      // Restaurant view
      return (
        <CardFooter className="flex justify-between pt-0">
          <Button variant="secondary" size="sm" onClick={() => setShowDetails(true)}>
            <Info size={16} className="mr-1" />
            Details
          </Button>
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          )}
        </CardFooter>
      );
    } else {
      // Influencer view
      if (invitation.status === "pending") {
        return (
          <CardFooter className="flex justify-between pt-0">
            <Button 
              className="bg-purple-700 hover:bg-purple-800 text-white"
              size="sm" 
              onClick={handleAccept}
              disabled={updateStatusMutation.isPending}
            >
              <Check size={16} className="mr-1" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDecline}
              disabled={updateStatusMutation.isPending}
            >
              <X size={16} className="mr-1" />
              Decline
            </Button>
          </CardFooter>
        );
      } else if (invitation.status === "accepted") {
        return (
          <CardFooter className="flex justify-end pt-0">
            <Button className="bg-purple-700 hover:bg-purple-800 text-white" size="sm" onClick={() => setShowDetails(true)}>
              <ExternalLink size={16} className="mr-1" />
              Submit Content
            </Button>
          </CardFooter>
        );
      } else {
        return (
          <CardFooter className="flex justify-end pt-0">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
              <Info size={16} className="mr-1" />
              View Details
            </Button>
          </CardFooter>
        );
      }
    }
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-200",
        invitation.status === "pending" && !isRestaurantView && "ring-1 ring-primary"
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge variant={statusConfig[invitation.status].variant}>
              {statusConfig[invitation.status].label}
            </Badge>
            {invitation.expiresAt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar size={12} className="mr-1" />
                      Expires: {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This invitation will expire on {format(new Date(invitation.expiresAt), "MMMM d, yyyy")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <CardTitle className="text-lg">{invitation.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {invitation.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitation.imageUrl && (
              <div className="aspect-video overflow-hidden rounded-md">
                <img
                  src={invitation.imageUrl}
                  alt={invitation.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="flex justify-between">
              <div className="text-sm">
                <p className="font-medium">Reward</p>
                <p className="text-xs">${invitation.rewardAmount} per {invitation.rewardViews} views</p>
              </div>

              {isRestaurantView && invitation.status === "pending" && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("text-xs", copied && "bg-primary/10")}
                    onClick={handleCopyCode}
                  >
                    {copied ? (
                      <Check size={14} className="mr-1" />
                    ) : (
                      <Clipboard size={14} className="mr-1" />
                    )}
                    {copied ? "Copied" : "Copy Code"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        {renderFooter()}
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{invitation.title}</DialogTitle>
            <DialogDescription>
              Private invitation details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {invitation.imageUrl && (
              <div className="aspect-video overflow-hidden rounded-md">
                <img
                  src={invitation.imageUrl}
                  alt={invitation.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">{invitation.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Reward Amount</h4>
                <p className="text-sm text-muted-foreground">${invitation.rewardAmount}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Per Views</h4>
                <p className="text-sm text-muted-foreground">{invitation.rewardViews}</p>
              </div>
            </div>

            {isRestaurantView && (
              <div>
                <h4 className="text-sm font-medium">Invitation Code</h4>
                <div className="flex mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-xs flex-1 overflow-x-auto">
                    {invitation.inviteCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="ml-2"
                  >
                    {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  </Button>
                </div>
              </div>
            )}

            {invitation.expiresAt && (
              <div>
                <h4 className="text-sm font-medium">Expires</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(invitation.expiresAt), "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {isRestaurantView ? (
              <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
            ) : invitation.status === "accepted" ? (
              <Button className="bg-purple-700 hover:bg-purple-800 text-white" onClick={() => setShowDetails(false)}>Submit Content</Button>
            ) : (
              <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}