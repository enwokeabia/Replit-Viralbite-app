import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PrivateInvitation } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";

import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { PrivateInvitationCard } from "@/components/private-invitation-card";

export default function PrivateInvitationsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: invitations = [], isLoading } = useQuery<PrivateInvitation[]>({
    queryKey: ["/api/private-invitations"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Filter invitations by status and search term
  const filterInvitations = (status: string) => {
    return invitations.filter(invitation => 
      invitation.status === status && 
      (invitation.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       invitation.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Group invitations by status
  const pendingInvitations = filterInvitations("pending");
  const acceptedInvitations = filterInvitations("accepted");
  const completedInvitations = filterInvitations("completed");
  const declinedInvitations = filterInvitations("declined");

  return (
    <div className="container py-6">
      <Header 
        title="Private Invitations" 
        description="Exclusive collaboration opportunities sent directly to you"
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search invitations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending <span className="ml-2 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">{pendingInvitations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">{acceptedInvitations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{completedInvitations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">{declinedInvitations.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : pendingInvitations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Send className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <h3 className="text-lg font-semibold">No pending invitations</h3>
              <p className="mt-1">When restaurants send you private invitations, they'll appear here</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pendingInvitations.map((invitation) => (
                <PrivateInvitationCard 
                  key={invitation.id} 
                  invitation={invitation} 
                  viewType="influencer" 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="accepted" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : acceptedInvitations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Send className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <h3 className="text-lg font-semibold">No accepted invitations</h3>
              <p className="mt-1">When you accept invitations, they'll appear here</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {acceptedInvitations.map((invitation) => (
                <PrivateInvitationCard 
                  key={invitation.id} 
                  invitation={invitation} 
                  viewType="influencer" 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : completedInvitations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Send className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <h3 className="text-lg font-semibold">No completed invitations</h3>
              <p className="mt-1">Invitations you've submitted content for will appear here</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {completedInvitations.map((invitation) => (
                <PrivateInvitationCard 
                  key={invitation.id} 
                  invitation={invitation} 
                  viewType="influencer" 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="declined" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : declinedInvitations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Send className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <h3 className="text-lg font-semibold">No declined invitations</h3>
              <p className="mt-1">Invitations you've declined will appear here</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {declinedInvitations.map((invitation) => (
                <PrivateInvitationCard 
                  key={invitation.id} 
                  invitation={invitation} 
                  viewType="influencer" 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}