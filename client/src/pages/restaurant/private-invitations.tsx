import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { PrivateInvitationModal } from "@/components/private-invitation-modal";
import { PrivateInvitationCard } from "@/components/private-invitation-card";
import { type PrivateInvitation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function RestaurantPrivateInvitations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["/api/restaurant/private-invitations"],
    queryFn: async () => {
      const res = await fetch(`/api/restaurant/${user?.id}/private-invitations`);
      if (!res.ok) throw new Error("Failed to fetch private invitations");
      return await res.json();
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/private-invitations/${id}`);
      if (!res.ok) throw new Error("Failed to delete invitation");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/private-invitations"] });
      toast({
        title: "Invitation deleted",
        description: "The private invitation has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this invitation?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header title="Private Invitations" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Private Invitations</h1>
              <p className="text-slate-500">Create and manage your exclusive invitations to specific influencers</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              <span>New Invitation</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invitations?.length === 0 ? (
            <div className="text-center py-12 bg-white border border-border rounded-lg shadow-sm">
              <h3 className="text-lg font-medium">No private invitations yet</h3>
              <p className="text-muted-foreground mt-1">
                Create your first invitation to work directly with a specific influencer
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                Create Invitation
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations?.map((invitation: PrivateInvitation) => (
                <PrivateInvitationCard 
                  key={invitation.id} 
                  invitation={invitation}
                  viewType="restaurant"
                  onDelete={() => handleDelete(invitation.id)}
                />
              ))}
            </div>
          )}

          <PrivateInvitationModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
          />
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}