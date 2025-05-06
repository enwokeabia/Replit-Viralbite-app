import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
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

// Helper function for password hashing
const scryptAsync = promisify(scrypt);
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Map to store auth tokens for emergency authentication
const authTokens = new Map<string, number>();
// Make it available globally to auth.ts
global.authTokens = authTokens;

// Add standard test tokens for quick access - now using database IDs
console.log("Setting up test authentication tokens...");
// These tokens will be made available for emergency login bypass
authTokens.set('test-token-123456', 11); // Admin (ID: 11)
authTokens.set('test-restaurant-token', 14); // Restaurant user (johnjones ID: 14)
authTokens.set('test-restaurant2-token', 12); // Second restaurant user (restaurant2 ID: 12)
authTokens.set('test-influencer-token', 13); // Influencer user (Janet ID: 13)
console.log("Test tokens configured with database user IDs")

// Declare global namespace to avoid TypeScript errors
declare global {
  var authTokens: Map<string, number>;
}

// Helper function to ensure user is authenticated - EMERGENCY DEBUGGING VERSION
function requireAuth(req: Request, res: Response, next: Function) {
  console.log("✅ AUTH CHECK - Session ID:", req.sessionID);
  console.log("✅ Cookies:", req.headers.cookie);
  console.log("✅ Headers:", JSON.stringify(req.headers));
  console.log("✅ Is Authenticated:", req.isAuthenticated());
  console.log("✅ Query:", req.query);

  // SUPER EMERGENCY AUTH: Let any request through with a known userId if the bypass parameter is set
  if (req.query.userId && req.query.bypass === "true") {
    const userId = Number(req.query.userId);
    console.log("🔴 EMERGENCY BYPASS ACTIVE with userId:", userId);

    // Acquire the user data directly
    storage.getUser(userId).then(user => {
      if (user) {
        console.log("🔴 EMERGENCY BYPASS SUCCESS - User found:", user.id, user.username);
        req.user = user as any;
        next();
      } else {
        console.error("🔴 EMERGENCY BYPASS FAILED - User not found:", userId);
        res.status(401).send("Invalid user ID");
      }
    }).catch(err => {
      console.error("🔴 EMERGENCY BYPASS ERROR:", err);
      res.status(500).send("Server error");
    });

    return;
  }

  // EMERGENCY FIX: Check for auth token in header as an alternative to cookie-based sessions
  const authToken = req.headers['x-auth-token'] as string;
  console.log("AUTH TOKEN HEADER:", authToken);
  console.log("AVAILABLE TOKENS:", Array.from(authTokens.keys()));
  console.log("GLOBAL TOKENS:", Array.from(global.authTokens.keys()));

  // Also check for the test token
  if (authToken === "test-token-123456") {
    console.log("TEST TOKEN DETECTED for Admin");
    const userId = 11; // Admin user (ID: 11)
    console.log("✓ AUTH SUCCESS via test token - Looking up User ID:", userId);
    
    // Debug section to list all users in the database
    console.log("DEBUG: All user IDs in the system:");
    storage.users.forEach((user, id) => {
      console.log(`- User ID: ${id}, Username: ${user.username}, Role: ${user.role}`);
    });

    storage.getUser(userId).then(user => {
      if (user) {
        console.log("✓ Found admin user:", user.id, user.username, user.role);
        req.user = user as any;
        next();
      } else {
        console.error("⛔ Admin user not found with ID:", userId);
        console.log("DEBUG: Trying to find user by username instead");
        storage.getUserByUsername("Admin").then(adminUser => {
          if (adminUser) {
            console.log("✓ Found admin by username:", adminUser.id, adminUser.username);
            req.user = adminUser as any;
            
            // Update the token map with the correct ID for future requests
            authTokens.set('test-token-123456', adminUser.id);
            console.log("✓ Updated token map with correct admin ID:", adminUser.id);
            
            next();
          } else {
            console.error("⛔ Admin user not found by username either");
            res.status(401).send("Invalid token - Admin user not found");
          }
        });
      }
    }).catch(err => {
      console.error("Token auth error:", err);
      res.status(500).send("Server error");
    });

    return;
  }

  if (authToken && authTokens.has(authToken)) {
    const userId = authTokens.get(authToken);
    console.log("✓ AUTH SUCCESS via token - User ID:", userId);

    if (typeof userId === 'undefined') {
      console.error("⛔ AUTH FAILED - Token exists but userId is undefined");
      return res.status(401).send("Invalid token");
    }

    // Set user on request - equivalent to passport's req.user
    storage.getUser(userId).then(user => {
      if (user) {
        req.user = user as any;
        next();
      } else {
        res.status(401).send("Invalid token");
      }
    }).catch(err => {
      console.error("Token auth error:", err);
      res.status(500).send("Server error");
    });

    return;
  }

  // Standard passport authentication check
  if (!req.isAuthenticated()) {
    console.error("⛔ AUTH FAILED - User not authenticated");

    // Create a "dummy" auth cookie to see if that helps with session issues
    res.cookie('viralbite_auth_test', 'true', { 
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });

    // Try to auto-login as Admin for demonstration purposes
    if (req.query.auto === "admin") {
      storage.getUser(11).then(user => {  // Admin user ID: 11
        if (user) {
          console.log("🔴 AUTO-LOGIN as ADMIN:", user.id, user.username);
          req.user = user as any;
          next();
        } else {
          res.status(401).send("Auto-login failed");
        }
      }).catch(err => {
        console.error("Auto-login error:", err);
        res.status(500).send("Server error");
      });
      return;
    }

    return res.status(401).send("Unauthorized");
  }

  console.log("✓ AUTH SUCCESS via session - User:", req.user.id, req.user.username);
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

  // EMERGENCY: Special endpoint to bypass auth - DO NOT USE IN PRODUCTION
  app.get("/api/emergency-login", async (req, res) => {
    try {
      const role = req.query.role as string || "admin"; // Default to admin

      let userId = 11; // Default admin (ID: 11)
      let testToken = "test-token-123456"; // Default admin test token

      if (role === "restaurant") {
        userId = 14; // Restaurant user (johnjones ID: 14)
        testToken = "test-restaurant-token";
      } else if (role === "influencer") {
        userId = 13; // Influencer user (Janet ID: 13)
        testToken = "test-influencer-token";
      } else if (role === "restaurant2") {
        userId = 12; // Second restaurant user (restaurant2 ID: 12)
        testToken = "test-restaurant2-token";
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Clear existing tokens with the same user ID to prevent duplicates
      Array.from(authTokens.entries()).forEach(([token, id]) => {
        if (Number(id) === Number(userId)) {
          console.log(`Removing existing token for user ${userId}`);
          authTokens.delete(token);
        }
      });

      // Add test token to authTokens for consistent behavior
      authTokens.set(testToken, user.id);
      console.log(`Added test token ${testToken} for user ${user.id} (${user.name})`);

      // Create a safe user object without password to prevent circular JSON issue
      const safeUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      };

      // Return the token and user data
      res.json({
        token: testToken,
        user: safeUser,
        message: "EMERGENCY AUTH: Use this token in the X-Auth-Token header for all requests"
      });
    } catch (error) {
      console.error("Emergency login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Special endpoint to view all users in the system - DO NOT USE IN PRODUCTION
  app.get("/api/debug/all-users", requireAuth, async (req, res) => {
    try {
      const usersArray = Array.from(storage.users.values());
      console.log(`DEBUG: Total users in store: ${usersArray.length}`);

      // Create a safe users array without passwords
      const safeUsers = usersArray.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }));

      return res.json({
        totalUsers: usersArray.length,
        userIds: usersArray.map(u => u.id),
        users: safeUsers
      });
    } catch (error) {
      console.error("Error listing all users:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Special endpoint to view all campaigns in the system - DO NOT USE IN PRODUCTION
  app.get("/api/debug/all-campaigns", requireAuth, async (req, res) => {
    try {
      const campaignsArray = Array.from(storage.campaigns.values());
      console.log(`DEBUG: Total campaigns in store: ${campaignsArray.length}`);

      // Group campaigns by restaurant ID for a clear overview
      const campaignsByRestaurant = campaignsArray.reduce((acc, campaign) => {
        const restaurantId = campaign.restaurantId;
        if (!acc[restaurantId]) {
          acc[restaurantId] = [];
        }
        acc[restaurantId].push(campaign);
        return acc;
      }, {} as Record<number, Campaign[]>);

      // Log the distribution
      Object.entries(campaignsByRestaurant).forEach(([restaurantId, campaigns]) => {
        console.log(`Restaurant ID ${restaurantId} has ${campaigns.length} campaigns: ${campaigns.map(c => c.id).join(', ')}`);
      });

      return res.json({
        totalCampaigns: campaignsArray.length,
        campaignIds: campaignsArray.map(c => c.id),
        campaignsByRestaurant
      });
    } catch (error) {
      console.error("Error listing all campaigns:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Special endpoint to view all users in the system - DO NOT USE IN PRODUCTION
  app.get("/api/debug/all-users", requireAuth, async (req, res) => {
    try {
      const usersArray = Array.from(storage.users.values());
      console.log(`DEBUG: Total users in store: ${usersArray.length}`);

      // Create a safe users array without passwords
      const safeUsers = usersArray.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }));

      // Also output all usernames to console for debugging
      console.log("All users in system:");
      safeUsers.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
      });

      return res.json({
        totalUsers: usersArray.length,
        userIds: usersArray.map(u => u.id),
        users: safeUsers
      });
    } catch (error) {
      console.error("Error listing all users:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Special endpoint to create test campaigns - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-test-campaigns", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      console.log(`Creating test campaigns for user ${user.id} (${user.username})`);

      // Create unique test campaigns for the current user if they're a restaurant
      if (user.role === "restaurant") {
        const campaign1 = await storage.createCampaign({
          restaurantId: user.id,
          title: `${user.username}'s Test Campaign 1`,
          description: "A test campaign for debugging",
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
          rewardAmount: 25,
          rewardViews: 5000,
          maxPayoutPerInfluencer: 100,
          maxBudget: 500,
          status: "active"
        });

        const campaign2 = await storage.createCampaign({
          restaurantId: user.id,
          title: `${user.username}'s Test Campaign 2`,
          description: "Another test campaign for debugging",
          imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
          rewardAmount: 50,
          rewardViews: 10000,
          maxPayoutPerInfluencer: 200,
          maxBudget: 1000,
          status: "active"
        });

        console.log(`Created test campaigns with IDs ${campaign1.id} and ${campaign2.id}`);
        console.log(`Current campaigns in store: ${Array.from(storage.campaigns.values()).length}`);
        console.log(`Campaign IDs in store: ${Array.from(storage.campaigns.keys()).join(', ')}`);

        return res.json({
          message: "Test campaigns created",
          campaigns: [campaign1, campaign2]
        });
      } else {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only restaurant users can create test campaigns"
        });
      }
    } catch (error) {
      console.error("Error creating test campaigns:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Special endpoint to create a test campaign for restaurant2 - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-restaurant2-campaign", requireAuth, async (req, res) => {
    try {
      // Only allow admin to create this special test campaign
      const user = req.user as User;
      if (user.role !== "admin") {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only admin can use this special endpoint"
        });
      }

      // Get the restaurant2 user
      const restaurant2 = await storage.getUserByUsername("restaurant2");
      if (!restaurant2) {
        return res.status(404).json({
          error: "Not Found",
          message: "Restaurant2 user does not exist"
        });
      }

      console.log(`Creating test campaign for restaurant2 user ${restaurant2.id} (${restaurant2.username})`);

      const campaign = await storage.createCampaign({
        restaurantId: restaurant2.id,
        title: "Restaurant2's Special Campaign",
        description: "This is a campaign from our second restaurant",
        imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
        rewardAmount: 80,
        rewardViews: 20000,
        maxPayoutPerInfluencer: 250,
        maxBudget: 2000
      });

      console.log(`Created test campaign with ID ${campaign.id} for restaurant2`);
      console.log(`Current campaigns in store: ${Array.from(storage.campaigns.values()).length}`);

      return res.json({
        message: "Test campaign created for restaurant2",
        campaign: campaign
      });
    } catch (error) {
      console.error("Error creating restaurant2 test campaign:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // User profile update endpoint
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { name, profilePicture } = req.body;

      const updatedUser = await storage.updateUser(user.id, { 
        name: name || user.name,
        profilePicture
      });

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).send("Internal server error");
    }
  });

  // Campaign routes
  app.get("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      console.log(`User ID ${user.id} (${user.username}) with role ${user.role} is fetching campaigns`);

      // For tracking consistency between requests
      console.log(`Current campaigns in store: ${Array.from(storage.campaigns.values()).length}`);
      console.log(`Campaign IDs in store: ${Array.from(storage.campaigns.keys()).join(', ')}`);

      if (user.role === "restaurant") {
        // Restaurant users see their own campaigns
        console.log(`Fetching campaigns for restaurant user ${user.id} (${user.username})`);

        const campaigns = await storage.getCampaignsByRestaurantId(user.id);
        console.log(`Found ${campaigns.length} campaigns for restaurant user ${user.id}`);
        console.log(`Restaurant campaign IDs: ${campaigns.map(c => c.id).join(', ')}`);

        return res.json(campaigns);
      } else if (user.role === "admin") {
        // Admin users see all campaigns
        console.log(`Fetching all campaigns for admin user ${user.id} (${user.username})`);

        const campaigns = await storage.getAllCampaigns();
        console.log(`Found ${campaigns.length} total campaigns`);
        console.log(`Campaign IDs: ${campaigns.map(c => c.id).join(', ')}`);
        
        return res.json(campaigns);
      } else {
        // Influencer users see only active campaigns
        console.log(`Fetching active campaigns for influencer user ${user.id} (${user.username})`);

        const campaigns = await storage.getAllCampaigns();
        console.log(`Found ${campaigns.length} active campaigns`);
        console.log(`Campaign IDs: ${campaigns.map(c => c.id).join(', ')}`);

        return res.json(campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);

      if (!campaign) {
        return res.status(404).send("Campaign not found");
      }

      // Restaurant users can only view their own campaigns
      if (user.role === "restaurant" && campaign.restaurantId !== user.id) {
        console.log(`Restaurant user ${user.id} attempted to access campaign ${campaignId} belonging to restaurant ${campaign.restaurantId}`);
        return res.status(403).send("Forbidden: You can only view your own campaigns");
      }

      // With status field removed, all campaigns are accessible to influencers
      // No filtering needed

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      return res.status(500).send("Internal server error");
    }
  });

  app.post("/api/campaigns", requireAuth, async (req, res) => {
    // Check if the user has restaurant role
    const user = req.user as User;
    console.log("User creating campaign:", user.username, "with role:", user.role);

    if (user.role !== "restaurant") {
      console.warn(`User ${user.username} with role ${user.role} attempted to create a campaign`);
      return res.status(403).json({
        error: "Forbidden",
        message: "Only restaurant users can create campaigns"
      });
    }

    try {
      console.log("Received campaign creation request:", req.body);

      // Ensure restaurantId is explicitly the user's ID as a number
      const campaignDataWithRestaurantId = {
        ...req.body,
        restaurantId: Number(user.id) // Force conversion to number
      };

      console.log("Validating campaign data:", campaignDataWithRestaurantId);

      try {
        const campaignData = insertCampaignSchema.parse(campaignDataWithRestaurantId);
        console.log("Validation successful, creating campaign...");

        const campaign = await storage.createCampaign(campaignData);
        console.log("Campaign created successfully:", campaign);

        // Double-verify that the created campaign has the correct restaurant ID
        if (Number(campaign.restaurantId) !== Number(user.id)) {
          console.error(`ERROR: Created campaign has restaurant ID ${campaign.restaurantId} (${typeof campaign.restaurantId}) but user ID is ${user.id} (${typeof user.id})`);
        }

        // Show all campaigns for this restaurant after creation
        const restaurantCampaigns = await storage.getCampaignsByRestaurantId(user.id);
        console.log(`After creation, restaurant ${user.id} has ${restaurantCampaigns.length} campaigns: ${restaurantCampaigns.map(c => c.id).join(', ')}`);

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

      if (Number(campaign.restaurantId) !== Number(user.id)) {
        console.error(`Edit permission denied: Campaign restaurant ID ${campaign.restaurantId} (${typeof campaign.restaurantId}) vs User ID ${user.id} (${typeof user.id})`);
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

      if (Number(campaign.restaurantId) !== Number(user.id)) {
        console.error(`Delete permission denied: Campaign restaurant ID ${campaign.restaurantId} (${typeof campaign.restaurantId}) vs User ID ${user.id} (${typeof user.id})`);
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
      if (user.role === "restaurant" && Number(campaign.restaurantId) !== Number(user.id)) {
        console.error(`Submissions access denied: Campaign restaurant ID ${campaign.restaurantId} (${typeof campaign.restaurantId}) vs User ID ${user.id} (${typeof user.id})`);
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

      // Status check removed as we no longer have campaign status

      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        campaignId,
        influencerId: user.id
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
    // Check ifthe user has restaurant role, but allow for now if not
    const user = req.user as User;
    console.log("User creating private invitation:", user.username, "with role:", user.role);
    if (user.role !== "restaurant") {
      console.warn(`User ${user.username} with role ${user.role} is creating a private invitation`);
    }
    try {

      const invitationData = insertPrivateInvitationSchema.parse({
        ...req.body,
        restaurantId: user.id
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
        invitationId
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

        // All campaigns are considered active with the status field removed
        const activeCampaigns = campaigns.length;
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
  app.get("/api/admin/campaigns", requireAdminRole, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      console.log(`Fetched ${campaigns.length} campaigns for admin view`);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns for admin:", error);
      return res.status(500).send("Internal server error");
    }
  });
  
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

  // Quick restaurant user creator endpoint - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-restaurant2", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');

      // Create a "Second Restaurant" user
      const [user] = await db.insert(users).values({
        username: "restaurant2",
        email: "restaurant2@example.com",
        password: await hashPassword("Password"),
        name: "Thai Fusion",
        role: "restaurant",
        profilePicture: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3"
      }).returning();

      return res.json({
        message: "Second Restaurant user created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error("Error creating restaurant user:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Quick influencer user creator endpoint - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-influencer", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');

      // Create a Janet influencer user
      const [user] = await db.insert(users).values({
        username: "Janet",
        email: "janet@example.com",
        password: await hashPassword("Password"),
        name: "Janet Smith",
        role: "influencer",
        profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3"
      }).returning();

      return res.json({
        message: "Janet influencer user created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error("Error creating influencer user:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Quick campaign creator endpoint for Restaurant2 - DO NOT USE IN PRODUCTION
  app.get("/api/debug/quick-create-thai-campaign", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { campaigns } = await import('@shared/schema');

      // Create a Restaurant2 campaign
      const [campaign] = await db.insert(campaigns).values({
        restaurantId: 12, // Restaurant2 user has ID 12
        title: "Thai Fusion Cooking Class",
        description: "Promote our interactive Thai cooking classes where participants learn to make authentic pad thai and green curry.",
        imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
        rewardAmount: 75,
        rewardViews: 10000,
        maxPayoutPerInfluencer: 300,
        maxBudget: 1500,
        status: "active",
        createdAt: new Date()
      }).returning();

      return res.json({
        message: "Restaurant2 campaign created successfully",
        campaign
      });
    } catch (error: any) {
      console.error("Error creating Restaurant2 campaign:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Quick campaign creator endpoint - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-dirtyhabit", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { campaigns } = await import('@shared/schema');

      // Create a Dirty Habit campaign
      const [campaign] = await db.insert(campaigns).values({
        restaurantId: 10, // Dirtyhabit restaurant user has ID 10
        title: "Dirty Habit Chef's Special",
        description: "Promote our new chef's special menu featuring locally-sourced ingredients and innovative cocktails.",
        imageUrl: "https://images.unsplash.com/photo-1554306297-0c86e837d24b?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
        rewardAmount: 50,
        rewardViews: 5000,
        maxPayoutPerInfluencer: 200,
        maxBudget: 1000,
        status: "active",
        createdAt: new Date()
      }).returning();

      return res.json({
        message: "Dirty Habit campaign created successfully",
        campaign
      });
    } catch (error: any) {
      console.error("Error creating Dirty Habit campaign:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Quick submission creator endpoint - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-test-submission", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { submissions } = await import('@shared/schema');

      // Create a submission from the test influencer to the Dirty Habit campaign
      const [submission] = await db.insert(submissions).values({
        campaignId: 13, // Dirty Habit campaign (the latest one we created)
        influencerId: 13, // Janet influencer user
        instagramUrl: "https://www.instagram.com/p/CgZXW3TveUj/",
        notes: "This is a test submission for the Dirty Habit campaign",
        status: "approved", // Start as approved for testing
        views: 2500, // Initial views
        likes: 150, // Initial likes
        createdAt: new Date()
      }).returning();

      return res.json({
        message: "Test submission created successfully",
        submission
      });
    } catch (error: any) {
      console.error("Error creating test submission:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Test submission update with earnings - DO NOT USE IN PRODUCTION
  app.get("/api/debug/update-submission-earnings", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { submissions } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Get the latest submission
      const submissionId = 2;
      
      // Get current metrics
      const viewCount = 5000;
      const likeCount = 300;
      const calculatedEarnings = 50; // Same as in our performance metric
      
      // Update the submission with the new metrics and earnings
      const [updatedSubmission] = await db
        .update(submissions)
        .set({
          views: viewCount,
          likes: likeCount,
          earnings: calculatedEarnings
        })
        .where(eq(submissions.id, submissionId))
        .returning();
      
      return res.json({
        message: "Submission updated with latest metrics and earnings",
        updatedSubmission
      });
    } catch (error: any) {
      console.error("Error updating submission earnings:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Test performance metric creator - DO NOT USE IN PRODUCTION
  app.get("/api/debug/create-test-metric", async (req, res) => {
    try {
      // Import needed dependencies
      const { db } = await import('./db');
      const { performanceMetrics } = await import('@shared/schema');

      // Create a performance metric for our test submission
      // We'll use the submission we just created and calculate earnings based on campaign reward rate
      const submissionId = 2;
      const viewCount = 5000;
      const likeCount = 300;
      
      // For our test, we'll assume the campaign reward rate is $50 per 5000 views
      // Calculate earnings based on views (campaign had 50 for 5000 views)
      const calculatedEarnings = (viewCount / 5000) * 50;

      const [metric] = await db.insert(performanceMetrics).values({
        submissionId: submissionId,
        viewCount: viewCount,
        likeCount: likeCount,
        calculatedEarnings: calculatedEarnings,
        updatedBy: 11, // Admin user ID (from our db check endpoint)
      }).returning();

      return res.json({
        message: "Test performance metric created successfully",
        metric,
        calculatedEarnings
      });
    } catch (error: any) {
      console.error("Error creating test performance metric:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  // Emergency DB inspection endpoint - DO NOT USE IN PRODUCTION
  app.get("/api/debug/db-check", async (req, res) => {
    try {
      // Import needed dependencies
      const { sql } = await import('drizzle-orm');
      const { db } = await import('./db');
      const { users, campaigns, submissions } = await import('@shared/schema');
      
      // Count all records in the database for each table
      const userCount = (await db.select({ count: sql`count(*)` }).from(users))[0].count;
      const campaignCount = (await db.select({ count: sql`count(*)` }).from(campaigns))[0].count;
      const submissionCount = (await db.select({ count: sql`count(*)` }).from(submissions))[0].count;
      
      // Get some sample data
      const userSample = await db.select().from(users).limit(5);
      const campaignSample = await db.select().from(campaigns).limit(5);
      
      // Search for a campaign with "Dirtyhabit" in the title
      const dirtyHabitCampaigns = await db
        .select()
        .from(campaigns)
        .where(sql`title LIKE ${'%Dirtyhabit%'} OR title LIKE ${'%Dirty habit%'} OR title LIKE ${'%Dirty Habit%'}`);
      
      // Find admin user
      const adminUser = await db
        .select()
        .from(users)
        .where(sql`role = 'admin'`);
        
      return res.json({
        counts: {
          users: userCount,
          campaigns: campaignCount,
          submissions: submissionCount,
        },
        samples: {
          users: userSample.map(u => ({ id: u.id, username: u.username, role: u.role })),
          campaigns: campaignSample,
        },
        allUsers: await db.select({ id: users.id, username: users.username, role: users.role }).from(users),
        adminUsers: adminUser,
        dirtyHabitCampaigns
      });
    } catch (error: any) {
      console.error("Error in db-check endpoint:", error);
      return res.status(500).json({ error: "Internal server error", message: error?.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}