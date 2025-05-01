import { useState } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { PrivateInvitation } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Send, Calendar, DollarSign, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface PrivateInvitationCardProps {
  invitation: PrivateInvitation;
  viewType: "restaurant" | "influencer";
}

export function PrivateInvitationCard({ invitation, viewType }: PrivateInvitationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusColorMap = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (status: "accepted" | "declined") => {
      const res = await apiRequest("PUT", `/api/private-invitations/${invitation.id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The invitation status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/private-invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const submitContentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/private-invitations/${invitation.id}/submissions`, {
        instagramUrl,
        notes,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Submitted",
        description: "Your Instagram Reel has been submitted successfully.",
      });
      setSubmissionOpen(false);
      setInstagramUrl("");
      setNotes("");
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/private-invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit content: ${error.message}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleAccept = () => {
    updateStatusMutation.mutate("accepted");
  };

  const handleDecline = () => {
    updateStatusMutation.mutate("declined");
  };

  const handleSubmitContent = () => {
    if (!instagramUrl) {
      toast({
        title: "Error",
        description: "Please enter your Instagram Reel URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    submitContentMutation.mutate();
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{invitation.title}</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                {format(new Date(invitation.createdAt), "MMM d, yyyy")}
              </CardDescription>
            </div>
            <Badge className={statusColorMap[invitation.status]}>
              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        {invitation.imageUrl && (
          <div className="w-full h-48 overflow-hidden">
            <img 
              src={invitation.imageUrl} 
              alt={invitation.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardContent className="pt-4">
          <p className="text-sm mb-4">{invitation.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <span>${invitation.rewardAmount} per {invitation.rewardViews.toLocaleString()} views</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Sent {format(new Date(invitation.createdAt), "MMM d, yyyy")}</span>
            </div>
            
            {invitation.expiresAt && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Expires {format(new Date(invitation.expiresAt), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 flex justify-end gap-2">
          {viewType === "influencer" && invitation.status === "pending" && (
            <>
              <Button variant="outline" size="sm" onClick={handleDecline}>
                <X className="mr-2 h-4 w-4" /> Decline
              </Button>
              <Button size="sm" onClick={handleAccept}>
                <Check className="mr-2 h-4 w-4" /> Accept
              </Button>
            </>
          )}
          
          {viewType === "influencer" && invitation.status === "accepted" && (
            <Button size="sm" onClick={() => setSubmissionOpen(true)}>
              <Send className="mr-2 h-4 w-4" /> Submit Content
            </Button>
          )}
          
          {viewType === "restaurant" && invitation.status === "pending" && (
            <Button variant="outline" size="sm" disabled>
              Awaiting Response
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Submission Dialog */}
      <Dialog open={submissionOpen} onOpenChange={setSubmissionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Instagram Reel</DialogTitle>
            <DialogDescription>
              Please provide the link to your Instagram Reel for this invitation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="instagramUrl" className="text-sm font-medium">
                Instagram Reel URL <span className="text-red-500">*</span>
              </label>
              <Input
                id="instagramUrl"
                placeholder="https://www.instagram.com/reel/..."
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Paste the full URL to your Instagram Reel.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any notes about your submission..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitContent} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}