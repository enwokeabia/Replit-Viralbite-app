import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Loader2 } from "lucide-react";
import { PrivateInvitationCard } from "@/components/private-invitation-card";
import { type PrivateInvitation } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InfluencerPrivateInvitations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["/api/influencer/private-invitations"],
    queryFn: async () => {
      const res = await fetch(`/api/influencer/${user?.id}/private-invitations`);
      if (!res.ok) throw new Error("Failed to fetch private invitations");
      return await res.json();
    },
    enabled: !!user,
  });

  // Filter invitations by status
  const pendingInvitations = invitations?.filter(
    (invitation: PrivateInvitation) => invitation.status === "pending"
  );
  
  const acceptedInvitations = invitations?.filter(
    (invitation: PrivateInvitation) => invitation.status === "accepted"
  );
  
  const completedInvitations = invitations?.filter(
    (invitation: PrivateInvitation) => 
      invitation.status === "completed" || invitation.status === "declined"
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Header 
        title="Private Invitations" 
        description="Exclusive campaign opportunities sent directly to you"
      />

      <Tabs defaultValue="pending" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingInvitations?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingInvitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">History</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="pending">
              {pendingInvitations?.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No pending invitations</h3>
                  <p className="text-muted-foreground mt-1">
                    You don't have any pending private campaign invitations
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingInvitations?.map((invitation: PrivateInvitation) => (
                    <PrivateInvitationCard 
                      key={invitation.id} 
                      invitation={invitation}
                      viewType="influencer"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="active">
              {acceptedInvitations?.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No active invitations</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't accepted any private campaign invitations yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {acceptedInvitations?.map((invitation: PrivateInvitation) => (
                    <PrivateInvitationCard 
                      key={invitation.id} 
                      invitation={invitation}
                      viewType="influencer"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {completedInvitations?.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No completed invitations</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't completed any private campaigns yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedInvitations?.map((invitation: PrivateInvitation) => (
                    <PrivateInvitationCard 
                      key={invitation.id} 
                      invitation={invitation}
                      viewType="influencer"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}