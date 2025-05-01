import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCampaignSchema, 
  insertSubmissionSchema, 
  viewUpdateSchema,
  type Campaign, 
  type User 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function to ensure user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

// Helper function to ensure user has restaurant role
function requireRestaurantRole(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || (req.user as User).role !== "restaurant") {
    return res.status(403).send("Forbidden: Restaurant role required");
  }
  next();
}

// Helper function to ensure user has influencer role
function requireInfluencerRole(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || (req.user as User).role !== "influencer") {
    return res.status(403).send("Forbidden: Influencer role required");
  }
  next();
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

  app.post("/api/campaigns", requireRestaurantRole, async (req, res) => {
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

  // Statistics routes
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (user.role === "restaurant") {
        // Restaurant statistics
        const campaigns = await storage.getCampaignsByRestaurantId(user.id);
        const submissions = await storage.getSubmissionsByRestaurantId(user.id);
        
        const activeCampaigns = campaigns.filter(c => c.status === "active").length;
        const totalSubmissions = submissions.length;
        const approvedSubmissions = submissions.filter(s => s.status === "approved").length;
        const totalViews = submissions.reduce((sum, s) => sum + s.views, 0);
        const totalSpent = submissions.reduce((sum, s) => sum + s.earnings, 0);
        
        res.json({
          activeCampaigns,
          totalCampaigns: campaigns.length,
          totalSubmissions,
          approvedSubmissions,
          totalViews,
          totalSpent
        });
      } else {
        // Influencer statistics
        const submissions = await storage.getSubmissionsByInfluencerId(user.id);
        
        const activeSubmissions = submissions.filter(s => s.status === "approved").length;
        const pendingSubmissions = submissions.filter(s => s.status === "pending").length;
        const totalViews = submissions.reduce((sum, s) => sum + s.views, 0);
        const totalEarnings = submissions.reduce((sum, s) => sum + s.earnings, 0);
        
        res.json({
          totalSubmissions: submissions.length,
          activeSubmissions,
          pendingSubmissions,
          totalViews,
          totalEarnings
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
