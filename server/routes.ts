import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCampaignSchema, 
  insertSubmissionSchema, 
  viewUpdateSchema,
  insertPrivateInvitationSchema,
  insertPrivateSubmissionSchema,
  adminUpdateMetricSchema,
  insertPerformanceMetricSchema,
  insertPrivatePerformanceMetricSchema,
  type Campaign, 
  type User,
  type PrivateInvitation,
  type Submission,
  type PrivateSubmission
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function to ensure user is authenticated - with detailed debugging
function requireAuth(req: Request, res: Response, next: Function) {
  console.log("✅ AUTH CHECK - Session ID:", req.sessionID);
  console.log("✅ Cookies:", req.headers.cookie);
  console.log("✅ Headers:", JSON.stringify(req.headers));
  console.log("✅ Is Authenticated:", req.isAuthenticated());
  
  // IMPORTANT: Remove all role-based checks, allow any authenticated user
  if (!req.isAuthenticated()) {
    console.error("⛔ AUTH FAILED - User not authenticated");
    
    // Create a "dummy" auth cookie to see if that helps with session issues
    res.cookie('viralbite_auth_test', 'true', { 
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });
    
    return res.status(401).send("Unauthorized");
  }
  
  console.log("✓ AUTH SUCCESS - User:", req.user.id, req.user.username);
  next();
}

// All of these role-based functions now just use the basic authentication check
// This allows any authenticated user to perform any action
function requireRestaurantRole(req: Request, res: Response, next: Function) {
  requireAuth(req, res, next);
}

function requireInfluencerRole(req: Request, res: Response, next: Function) {
  requireAuth(req, res, next);
}

function requireAdminRole(req: Request, res: Response, next: Function) {
  requireAuth(req, res, next);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Campaign routes
  app.get("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (user.role === "restaurant") {
        // Restaurant users see their own campaigns
        const campaigns = await storage.getCampaignsByRestaurantId(user.id);
        return res.json(campaigns);
      } else {
        // Influencer users see all active campaigns
        const campaigns = await storage.getActiveCampaigns();
        return res.json(campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).send("Campaign not found");
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/campaigns", requireAuth, async (req, res) => {
    // Check if the user has restaurant role, but allow for now if not
    const user = req.user as User;
    console.log("User creating campaign:", user.username, "with role:", user.role);
    if (user.role !== "restaurant") {
      console.warn(`User ${user.username} with role ${user.role} is creating a campaign`);
    }
    try {
      console.log("Received campaign creation request:", req.body);
      const user = req.user as User;
      
      // Add restaurantId from authenticated user
      const campaignDataWithRestaurantId = {
        ...req.body,
        restaurantId: user.id
      };
      
      console.log("Validating campaign data:", campaignDataWithRestaurantId);
      
      try {
        const campaignData = insertCampaignSchema.parse(campaignDataWithRestaurantId);
        console.log("Validation successful, creating campaign...");
        
        const campaign = await storage.createCampaign(campaignData);
        console.log("Campaign created successfully:", campaign);
        
        res.status(201).json(campaign);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          console.error("Validation error:", validationError.errors);
          return res.status(400).json({
            error: "Validation Error",
            details: fromZodError(validationError).message,
            fieldErrors: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        throw validationError;
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.put("/api/campaigns/:id", requireRestaurantRole, async (req, res) => {
    try {
      const user = req.user as User;
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).send("Campaign not found");
      }
      
      if (campaign.restaurantId !== user.id) {
        return res.status(403).send("Forbidden: You can only edit your own campaigns");
      }
      
      const updatedCampaign = await storage.updateCampaign(campaignId, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.delete("/api/campaigns/:id", requireRestaurantRole, async (req, res) => {
    try {
      const user = req.user as User;
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).send("Campaign not found");
      }
      
      if (campaign.restaurantId !== user.id) {
        return res.status(403).send("Forbidden: You can only delete your own campaigns");
      }
      
      await storage.deleteCampaign(campaignId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Submission routes
  app.get("/api/submissions", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      let submissions;
      
      if (user.role === "restaurant") {
        submissions = await storage.getSubmissionsByRestaurantId(user.id);
      } else {
        submissions = await storage.getSubmissionsByInfluencerId(user.id);
      }
      
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/campaigns/:id/submissions", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).send("Campaign not found");
      }
      
      // Only restaurant owners can see all submissions for their campaigns
      if (user.role === "restaurant" && campaign.restaurantId !== user.id) {
        return res.status(403).send("Forbidden: You can only view submissions for your own campaigns");
      }
      
      const submissions = await storage.getSubmissionsByCampaignId(campaignId);
      
      // If influencer, filter to only show their own submissions
      const filteredSubmissions = user.role === "influencer" 
        ? submissions.filter(sub => sub.influencerId === user.id)
        : submissions;
      
      res.json(filteredSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/campaigns/:id/submissions", requireInfluencerRole, async (req, res) => {
    try {
      const user = req.user as User;
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).send("Campaign not found");
      }
      
      if (campaign.status !== "active") {
        return res.status(400).send("Cannot submit to inactive campaigns");
      }
      
      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        campaignId,
        influencerId: user.id,
        status: "pending"
      });
      
      const submission = await storage.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(fromZodError(error).message);
      }
      console.error("Error creating submission:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.put("/api/submissions/:id/status", requireRestaurantRole, async (req, res) => {
    try {
      const user = req.user as User;
      const submissionId = Number(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).send("Submission not found");
      }
      
      const campaign = await storage.getCampaign(submission.campaignId);
      
      if (!campaign || campaign.restaurantId !== user.id) {
        return res.status(403).send("Forbidden: You can only update submissions for your own campaigns");
      }
      
      const { status } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).send("Invalid status");
      }
      
      const updatedSubmission = await storage.updateSubmission(submissionId, { status });
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating submission status:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.put("/api/submissions/:id/views", requireAuth, async (req, res) => {
    try {
      const submissionId = Number(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).send("Submission not found");
      }
      
      const { views } = viewUpdateSchema.parse(req.body);
      
      // Only process view updates for approved submissions
      if (submission.status !== "approved") {
        return res.status(400).send("Cannot update views for submissions that are not approved");
      }
      
      // Get campaign to calculate earnings
      const campaign = await storage.getCampaign(submission.campaignId);
      if (!campaign) {
        return res.status(404).send("Associated campaign not found");
      }
      
      // Calculate earnings based on views and campaign reward rule
      const earnings = (views / campaign.rewardViews) * campaign.rewardAmount;
      
      const updatedSubmission = await storage.updateSubmission(submissionId, { 
        views, 
        earnings
      });
      
      res.json(updatedSubmission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(fromZodError(error).message);
      }
      console.error("Error updating views:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Private Invitation routes
  app.get("/api/private-invitations", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      let invitations;
      
      if (user.role === "restaurant") {
        invitations = await storage.getPrivateInvitationsByRestaurantId(user.id);
      } else {
        invitations = await storage.getPrivateInvitationsByInfluencerId(user.id);
      }
      
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching private invitations:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/private-invitations/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const invitationId = Number(req.params.id);
      const invitation = await storage.getPrivateInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      // Only allow access to users who are part of this invitation
      if (invitation.restaurantId !== user.id && invitation.influencerId !== user.id) {
        return res.status(403).send("Forbidden: You do not have access to this invitation");
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error fetching private invitation:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/private-invitations/code/:code", requireAuth, async (req, res) => {
    try {
      const inviteCode = req.params.code;
      const invitation = await storage.getPrivateInvitationByCode(inviteCode);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error fetching private invitation by code:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/private-invitations", requireAuth, async (req, res) => {
    // Check if the user has restaurant role, but allow for now if not
    const user = req.user as User;
    console.log("User creating private invitation:", user.username, "with role:", user.role);
    if (user.role !== "restaurant") {
      console.warn(`User ${user.username} with role ${user.role} is creating a private invitation`);
    }
    try {
      
      const invitationData = insertPrivateInvitationSchema.parse({
        ...req.body,
        restaurantId: user.id,
        status: "pending"
      });
      
      const invitation = await storage.createPrivateInvitation(invitationData);
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: fromZodError(error).message,
          fieldErrors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      console.error("Error creating private invitation:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.put("/api/private-invitations/:id/status", requireInfluencerRole, async (req, res) => {
    try {
      const user = req.user as User;
      const invitationId = Number(req.params.id);
      const invitation = await storage.getPrivateInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      // Only the invited influencer can update the status
      if (invitation.influencerId !== user.id) {
        return res.status(403).send("Forbidden: You can only respond to invitations sent to you");
      }
      
      // Only allow status to be updated to accepted or declined from pending
      const { status } = req.body;
      if (!status || !["accepted", "declined"].includes(status)) {
        return res.status(400).send("Invalid status. Must be 'accepted' or 'declined'");
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).send("Cannot update invitation that is not pending");
      }
      
      const updatedInvitation = await storage.updatePrivateInvitation(invitationId, { status });
      res.json(updatedInvitation);
    } catch (error) {
      console.error("Error updating private invitation status:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/private-invitations/:id/submissions", requireInfluencerRole, async (req, res) => {
    try {
      const user = req.user as User;
      const invitationId = Number(req.params.id);
      const invitation = await storage.getPrivateInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      // Only the invited influencer can submit content
      if (invitation.influencerId !== user.id) {
        return res.status(403).send("Forbidden: You can only submit content to invitations sent to you");
      }
      
      // Only allow submissions to accepted invitations
      if (invitation.status !== "accepted") {
        return res.status(400).send("Cannot submit to invitations that are not accepted");
      }
      
      const submissionData = insertPrivateSubmissionSchema.parse({
        ...req.body,
        invitationId,
        status: "pending"
      });
      
      const submission = await storage.createPrivateSubmission(submissionData);
      
      // Update invitation status to completed
      await storage.updatePrivateInvitation(invitationId, { status: "completed" });
      
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: fromZodError(error).message,
          fieldErrors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      console.error("Error creating private submission:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/private-invitations/:id/submissions", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const invitationId = Number(req.params.id);
      const invitation = await storage.getPrivateInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      // Only allow access to users who are part of this invitation
      if (invitation.restaurantId !== user.id && invitation.influencerId !== user.id) {
        return res.status(403).send("Forbidden: You do not have access to this invitation");
      }
      
      const submissions = await storage.getPrivateSubmissionsByInvitationId(invitationId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching private submissions:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.put("/api/private-submissions/:id/status", requireRestaurantRole, async (req, res) => {
    try {
      const user = req.user as User;
      const submissionId = Number(req.params.id);
      const submission = await storage.getPrivateSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).send("Private submission not found");
      }
      
      // Get the associated invitation to verify restaurant ownership
      const invitation = await storage.getPrivateInvitation(submission.invitationId);
      
      if (!invitation || invitation.restaurantId !== user.id) {
        return res.status(403).send("Forbidden: You can only update submissions for your own invitations");
      }
      
      const { status } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).send("Invalid status");
      }
      
      const updatedSubmission = await storage.updatePrivateSubmission(submissionId, { status });
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating private submission status:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.put("/api/private-submissions/:id/views", requireAuth, async (req, res) => {
    try {
      const submissionId = Number(req.params.id);
      const submission = await storage.getPrivateSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).send("Private submission not found");
      }
      
      const { views } = viewUpdateSchema.parse(req.body);
      
      // Only process view updates for approved submissions
      if (submission.status !== "approved") {
        return res.status(400).send("Cannot update views for submissions that are not approved");
      }
      
      // Get invitation to calculate earnings
      const invitation = await storage.getPrivateInvitation(submission.invitationId);
      if (!invitation) {
        return res.status(404).send("Associated invitation not found");
      }
      
      // Calculate earnings based on views and invitation reward rule
      const earnings = (views / invitation.rewardViews) * invitation.rewardAmount;
      
      const updatedSubmission = await storage.updatePrivateSubmission(submissionId, { 
        views, 
        earnings
      });
      
      res.json(updatedSubmission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).send(fromZodError(error).message);
      }
      console.error("Error updating private submission views:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Statistics routes
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (user.role === "restaurant") {
        // Restaurant statistics
        const campaigns = await storage.getCampaignsByRestaurantId(user.id);
        const submissions = await storage.getSubmissionsByRestaurantId(user.id);
        const privateInvitations = await storage.getPrivateInvitationsByRestaurantId(user.id);
        
        // Get all private submissions
        let privateSubmissions = [];
        for (const invitation of privateInvitations) {
          const subs = await storage.getPrivateSubmissionsByInvitationId(invitation.id);
          privateSubmissions.push(...subs);
        }
        
        const activeCampaigns = campaigns.filter(c => c.status === "active").length;
        const totalSubmissions = submissions.length + privateSubmissions.length;
        const approvedSubmissions = 
          submissions.filter(s => s.status === "approved").length + 
          privateSubmissions.filter(s => s.status === "approved").length;
        
        const totalViews = 
          submissions.reduce((sum, s) => sum + s.views, 0) + 
          privateSubmissions.reduce((sum, s) => sum + s.views, 0);
        
        const totalSpent = 
          submissions.reduce((sum, s) => sum + s.earnings, 0) + 
          privateSubmissions.reduce((sum, s) => sum + s.earnings, 0);
        
        res.json({
          activeCampaigns,
          totalCampaigns: campaigns.length,
          totalPrivateInvitations: privateInvitations.length,
          totalSubmissions,
          approvedSubmissions,
          totalViews,
          totalSpent
        });
      } else {
        // Influencer statistics
        const submissions = await storage.getSubmissionsByInfluencerId(user.id);
        const privateInvitations = await storage.getPrivateInvitationsByInfluencerId(user.id);
        
        // Get all private submissions
        let privateSubmissions = [];
        for (const invitation of privateInvitations) {
          const subs = await storage.getPrivateSubmissionsByInvitationId(invitation.id);
          privateSubmissions.push(...subs);
        }
        
        const activeSubmissions = 
          submissions.filter(s => s.status === "approved").length + 
          privateSubmissions.filter(s => s.status === "approved").length;
        
        const pendingSubmissions = 
          submissions.filter(s => s.status === "pending").length + 
          privateSubmissions.filter(s => s.status === "pending").length;
        
        const totalViews = 
          submissions.reduce((sum, s) => sum + s.views, 0) + 
          privateSubmissions.reduce((sum, s) => sum + s.views, 0);
        
        const totalEarnings = 
          submissions.reduce((sum, s) => sum + s.earnings, 0) + 
          privateSubmissions.reduce((sum, s) => sum + s.earnings, 0);
        
        res.json({
          totalSubmissions: submissions.length + privateSubmissions.length,
          activeSubmissions,
          pendingSubmissions,
          pendingInvitations: privateInvitations.filter(i => i.status === "pending").length,
          totalPrivateInvitations: privateInvitations.length,
          totalViews,
          totalEarnings
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Users routes
  app.get("/api/users/influencers", requireRestaurantRole, async (req, res) => {
    try {
      // Get all users with influencer role
      const allUsers = Array.from((storage as any).users.values());
      const influencers = allUsers.filter((user: any) => user.role === "influencer");
      
      // Return only the necessary information
      const influencerData = influencers.map((influencer: any) => ({
        id: influencer.id,
        name: influencer.name,
        email: influencer.email
      }));
      
      res.json(influencerData);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      return res.status(500).send("Internal server error");
    }
  });
  
  // Private Invitations routes
  app.get("/api/restaurant/:id/private-invitations", requireRestaurantRole, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      if (req.user?.id !== restaurantId) {
        return res.status(403).send("Unauthorized access to restaurant data");
      }
      
      const invitations = await storage.getPrivateInvitationsByRestaurantId(restaurantId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching restaurant private invitations:", error);
      return res.status(500).send("Internal server error");
    }
  });
  
  app.get("/api/influencer/:id/private-invitations", requireInfluencerRole, async (req, res) => {
    try {
      const influencerId = parseInt(req.params.id);
      
      if (req.user?.id !== influencerId) {
        return res.status(403).send("Unauthorized access to influencer data");
      }
      
      const invitations = await storage.getPrivateInvitationsByInfluencerId(influencerId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching influencer private invitations:", error);
      return res.status(500).send("Internal server error");
    }
  });
  
  app.post("/api/private-invitations", requireRestaurantRole, async (req, res) => {
    try {
      const invitationData = req.body;
      
      if (req.user?.id !== invitationData.restaurantId) {
        return res.status(403).send("Unauthorized to create invitation for another restaurant");
      }
      
      const invitation = await storage.createPrivateInvitation(invitationData);
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating private invitation:", error);
      return res.status(500).send("Internal server error");
    }
  });
  
  app.patch("/api/private-invitations/:id", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const updateData = req.body;
      
      const invitation = await storage.getPrivateInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      // If restaurant is updating, verify ownership
      if (req.user?.role === "restaurant" && req.user?.id !== invitation.restaurantId) {
        return res.status(403).send("Unauthorized to update this invitation");
      }
      
      // If influencer is updating, verify they are the target
      if (req.user?.role === "influencer" && req.user?.id !== invitation.influencerId) {
        return res.status(403).send("Unauthorized to update this invitation");
      }
      
      const updatedInvitation = await storage.updatePrivateInvitation(invitationId, updateData);
      res.json(updatedInvitation);
    } catch (error) {
      console.error("Error updating private invitation:", error);
      return res.status(500).send("Internal server error");
    }
  });
  
  app.delete("/api/private-invitations/:id", requireRestaurantRole, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const invitation = await storage.getPrivateInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).send("Private invitation not found");
      }
      
      // Verify ownership
      if (req.user?.id !== invitation.restaurantId) {
        return res.status(403).send("Unauthorized to delete this invitation");
      }
      
      // Delete the invitation
      await storage.deletePrivateInvitation(invitationId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting private invitation:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Admin routes for performance metrics
  app.get("/api/admin/submissions", requireAdminRole, async (req, res) => {
    try {
      const submissions = await storage.getSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions for admin:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Special admin endpoint to get all private submissions
  // This is a simplified approach - we need to enhance IStorage to include this method for better performance
  app.get("/api/admin/private-submissions", requireAdminRole, async (req, res) => {
    try {
      let allPrivateSubmissions: PrivateSubmission[] = [];
      
      // Get all private invitations
      const users = await Promise.all(
        Array.from((await storage.getSubmissions()).map(s => s.influencerId))
          .map(id => storage.getUser(id))
      );
      
      // Get restaurant users
      const restaurantUsers = users.filter(user => user && user.role === "restaurant");
      
      // For each restaurant, get their private invitations
      for (const user of restaurantUsers) {
        if (!user) continue;
        
        const invitations = await storage.getPrivateInvitationsByRestaurantId(user.id);
        
        // For each invitation, get the private submissions
        for (const invitation of invitations) {
          const submissions = await storage.getPrivateSubmissionsByInvitationId(invitation.id);
          allPrivateSubmissions = [...allPrivateSubmissions, ...submissions];
        }
      }
      
      res.json(allPrivateSubmissions);
    } catch (error) {
      console.error("Error fetching private submissions for admin:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/admin/submissions/:id/performance-history", requireAdminRole, async (req, res) => {
    try {
      const submissionId = Number(req.params.id);
      const metrics = await storage.getPerformanceMetricsBySubmissionId(submissionId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/admin/private-submissions/:id/performance-history", requireAdminRole, async (req, res) => {
    try {
      const submissionId = Number(req.params.id);
      const metrics = await storage.getPrivatePerformanceMetricsBySubmissionId(submissionId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching private performance metrics:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/admin/submissions/:id/performance", requireAdminRole, async (req, res) => {
    try {
      const user = req.user as User;
      const submissionId = Number(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).send("Submission not found");
      }
      
      // Validate the metrics data
      const { viewCount, likeCount } = adminUpdateMetricSchema.parse(req.body);
      
      // Get campaign to calculate earnings
      const campaign = await storage.getCampaign(submission.campaignId);
      if (!campaign) {
        return res.status(404).send("Associated campaign not found");
      }
      
      // Calculate earnings based on views and campaign reward rule
      const calculatedEarnings = (viewCount / campaign.rewardViews) * campaign.rewardAmount;
      
      // Create the performance metric record
      const metric = await storage.createPerformanceMetric({
        submissionId,
        viewCount,
        likeCount,
        calculatedEarnings,
        updatedBy: user.id
      });
      
      res.status(201).json(metric);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: fromZodError(error).message
        });
      }
      console.error("Error creating performance metric:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/admin/private-submissions/:id/performance", requireAdminRole, async (req, res) => {
    try {
      const user = req.user as User;
      const submissionId = Number(req.params.id);
      const submission = await storage.getPrivateSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).send("Private submission not found");
      }
      
      // Validate the metrics data
      const { viewCount, likeCount } = adminUpdateMetricSchema.parse(req.body);
      
      // Get invitation to calculate earnings
      const invitation = await storage.getPrivateInvitation(submission.invitationId);
      if (!invitation) {
        return res.status(404).send("Associated invitation not found");
      }
      
      // Calculate earnings based on views and invitation reward rule
      const calculatedEarnings = (viewCount / invitation.rewardViews) * invitation.rewardAmount;
      
      // Create the performance metric record
      const metric = await storage.createPrivatePerformanceMetric({
        privateSubmissionId: submissionId,
        viewCount,
        likeCount,
        calculatedEarnings,
        updatedBy: user.id
      });
      
      res.status(201).json(metric);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: fromZodError(error).message
        });
      }
      console.error("Error creating private performance metric:", error);
      return res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
