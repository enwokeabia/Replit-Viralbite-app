import { users, type User, type InsertUser, 
  campaigns, type Campaign, type InsertCampaign, 
  submissions, type Submission, type InsertSubmission,
  privateInvitations, type PrivateInvitation, type InsertPrivateInvitation,
  privateSubmissions, type PrivateSubmission, type InsertPrivateSubmission,
  performanceMetrics, type PerformanceMetric, type InsertPerformanceMetric,
  privatePerformanceMetrics, type PrivatePerformanceMetric, type InsertPrivatePerformanceMetric
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Storage collections for debugging
  users: Map<number, User>;
  campaigns: Map<number, Campaign>;
  submissions: Map<number, Submission>;
  privateInvitations: Map<number, PrivateInvitation>;
  privateSubmissions: Map<number, PrivateSubmission>;
  performanceMetrics: Map<number, PerformanceMetric>;
  privatePerformanceMetrics: Map<number, PrivatePerformanceMetric>;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Campaign methods
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaigns(): Promise<Campaign[]>;
  getCampaignsByRestaurantId(restaurantId: number): Promise<Campaign[]>;
  getActiveCampaigns(): Promise<Campaign[]>;
  getAllCampaigns(): Promise<Campaign[]>; // Added getAllCampaigns method
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Submission methods
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissions(): Promise<Submission[]>;
  getSubmissionsByCampaignId(campaignId: number): Promise<Submission[]>;
  getSubmissionsByInfluencerId(influencerId: number): Promise<Submission[]>;
  getSubmissionsByRestaurantId(restaurantId: number): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, submission: Partial<Submission>): Promise<Submission | undefined>;

  // Private Invitation methods
  getPrivateInvitation(id: number): Promise<PrivateInvitation | undefined>;
  getPrivateInvitationByCode(inviteCode: string): Promise<PrivateInvitation | undefined>;
  getPrivateInvitationsByRestaurantId(restaurantId: number): Promise<PrivateInvitation[]>;
  getPrivateInvitationsByInfluencerId(influencerId: number): Promise<PrivateInvitation[]>;
  createPrivateInvitation(invitation: InsertPrivateInvitation): Promise<PrivateInvitation>;
  updatePrivateInvitation(id: number, invitation: Partial<PrivateInvitation>): Promise<PrivateInvitation | undefined>;
  deletePrivateInvitation(id: number): Promise<boolean>;

  // Private Submission methods
  getPrivateSubmission(id: number): Promise<PrivateSubmission | undefined>;
  getPrivateSubmissionsByInvitationId(invitationId: number): Promise<PrivateSubmission[]>;
  createPrivateSubmission(submission: InsertPrivateSubmission): Promise<PrivateSubmission>;
  updatePrivateSubmission(id: number, submission: Partial<PrivateSubmission>): Promise<PrivateSubmission | undefined>;

  // Performance Metrics methods
  getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined>;
  getPerformanceMetricsBySubmissionId(submissionId: number): Promise<PerformanceMetric[]>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;

  // Private Performance Metrics methods
  getPrivatePerformanceMetric(id: number): Promise<PrivatePerformanceMetric | undefined>;
  getPrivatePerformanceMetricsBySubmissionId(privateSubmissionId: number): Promise<PrivatePerformanceMetric[]>;
  createPrivatePerformanceMetric(metric: InsertPrivatePerformanceMetric): Promise<PrivatePerformanceMetric>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  // Make campaigns map public so we can debug it in routes
  users: Map<number, User>;
  campaigns: Map<number, Campaign>;
  submissions: Map<number, Submission>;
  privateInvitations: Map<number, PrivateInvitation>;
  privateSubmissions: Map<number, PrivateSubmission>;
  performanceMetrics: Map<number, PerformanceMetric>;
  privatePerformanceMetrics: Map<number, PrivatePerformanceMetric>;
  private userIdCounter: number;
  private campaignIdCounter: number;
  private submissionIdCounter: number;
  private privateInvitationIdCounter: number;
  private privateSubmissionIdCounter: number;
  private performanceMetricIdCounter: number;
  private privatePerformanceMetricIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    // Initialize the maps
    this.users = new Map();
    this.campaigns = new Map();
    this.submissions = new Map();
    this.privateInvitations = new Map();
    this.privateSubmissions = new Map();
    this.performanceMetrics = new Map();
    this.privatePerformanceMetrics = new Map();

    // Initialize the ID counters with starting values
    this.userIdCounter = 1;
    this.campaignIdCounter = 1;
    this.submissionIdCounter = 1;
    this.privateInvitationIdCounter = 1;
    this.privateSubmissionIdCounter = 1;
    this.performanceMetricIdCounter = 1;
    this.privatePerformanceMetricIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h, clear expired entries
    });

    // Password is "Password"
    const adminPasswordHash = "ade3e42b3773eabd4c050d7355dfd96e65c89e545a3f040e62d22ce5e86903928cbcf4f4342a12d1c38f87d74d13fd5930940c0c5658e2ed530de62f31e8667d.e16aa36aa6ee2717ced407b074195e04";

    // Create admin user for demo/testing purposes
    const adminUser: User = {
      id: this.userIdCounter++,
      username: "Admin",
      password: adminPasswordHash,
      name: "Administrator",
      email: "admin@viralbite.com",
      role: "admin",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Create test restaurant user
    const testRestaurantUser: User = {
      id: this.userIdCounter++,
      username: "johnjones",
      password: adminPasswordHash, // Same password for testing
      name: "John Jones",
      email: "john@restaurant.com",
      role: "restaurant",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(testRestaurantUser.id, testRestaurantUser);

    // Create test influencer user
    const testInfluencerUser: User = {
      id: this.userIdCounter++,
      username: "Janet",
      password: adminPasswordHash, // Same password for testing
      name: "Janet Smith",
      email: "janet@influencer.com",
      role: "influencer",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(testInfluencerUser.id, testInfluencerUser);

    // Create second restaurant user for multi-restaurant testing
    const testRestaurant2User: User = {
      id: this.userIdCounter++, 
      username: "restaurant2",
      password: adminPasswordHash, // Same password for testing
      name: "Second Restaurant",
      email: "second@restaurant.com",
      role: "restaurant",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(testRestaurant2User.id, testRestaurant2User);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      profilePicture: insertUser.profilePicture || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Campaign methods
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaignsByRestaurantId(restaurantId: number): Promise<Campaign[]> {
    // Get all campaigns and perform strict equality check on restaurantId with additional type checking
    const campaigns = Array.from(this.campaigns.values())
      .filter((campaign) => {
        // Convert both values to numbers for reliable comparison
        const campaignRestaurantId = Number(campaign.restaurantId);
        const requestedId = Number(restaurantId);

        const matches = campaignRestaurantId === requestedId;
        console.log(`Campaign ID ${campaign.id}, Restaurant ID ${campaignRestaurantId} (${typeof campaign.restaurantId}), Requested ID ${requestedId} (${typeof restaurantId}), Match: ${matches}`);
        return matches;
      });

    console.log(`Found ${campaigns.length} campaigns for restaurant ID ${restaurantId}`);

    // Additional verification for debugging
    if (campaigns.length > 0) {
      console.log("Restaurant campaigns:", campaigns.map(c => ({id: c.id, title: c.title, restaurantId: c.restaurantId})));
    } else {
      console.log("No campaigns found for this restaurant.");
    }

    return campaigns;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    // Get all campaigns that are active
    const campaigns = Array.from(this.campaigns.values())
      .filter((campaign) => {
        const isActive = campaign.status === "active";
        console.log(`Campaign ID ${campaign.id}, Status: ${campaign.status}, Active: ${isActive}`);
        return isActive;
      });

    console.log(`Found ${campaigns.length} active campaigns`);
    return campaigns;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    // Increment the ID counter to ensure we always get a unique ID
    const id = this.campaignIdCounter++;
    const createdAt = new Date();

    // Ensure restaurantId is stored as a number
    const restaurantId = Number(insertCampaign.restaurantId);

    console.log(`Creating campaign with ID ${id} for restaurant ${restaurantId} (original type: ${typeof insertCampaign.restaurantId})`);
    console.log(`Campaign ID counter is now ${this.campaignIdCounter}`);
    console.log(`Current campaigns in store: ${this.campaigns.size}`);

    // Create a campaign with all required fields explicitly assigned
    const campaign: Campaign = {
      id,
      restaurantId, // Using the converted number
      title: insertCampaign.title,
      description: insertCampaign.description,
      location: insertCampaign.location || null,
      imageUrl: insertCampaign.imageUrl,
      rewardAmount: insertCampaign.rewardAmount,
      rewardViews: insertCampaign.rewardViews,
      maxPayoutPerInfluencer: insertCampaign.maxPayoutPerInfluencer || null,
      maxBudget: insertCampaign.maxBudget || null,
      status: insertCampaign.status,
      createdAt
    };

    // Add the campaign to the campaigns map
    this.campaigns.set(id, campaign);

    console.log(`After creation, campaigns in store: ${this.campaigns.size}`);
    console.log(`All campaign IDs: ${Array.from(this.campaigns.keys()).join(', ')}`);

    // Verify restaurant ID is correctly stored - this is crucial for filtering
    console.log(`Verifying campaign ${id}:`);
    console.log(`- Restaurant ID: ${campaign.restaurantId} (${typeof campaign.restaurantId})`);

    // Verify the campaign can be retrieved by restaurant ID
    const restaurantCampaigns = await this.getCampaignsByRestaurantId(restaurantId);
    console.log(`Verification: Restaurant ${restaurantId} has ${restaurantCampaigns.length} campaigns after creation`);

    return campaign;
  }

  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign = { ...campaign, ...campaignUpdate };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Submission methods
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values());
  }

  async getSubmissionsByCampaignId(campaignId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => Number(submission.campaignId) === Number(campaignId));
  }

  async getSubmissionsByInfluencerId(influencerId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => Number(submission.influencerId) === Number(influencerId));
  }

  async getSubmissionsByRestaurantId(restaurantId: number): Promise<Submission[]> {
    // Use Number conversion for consistent comparison
    const numRestaurantId = Number(restaurantId);
    console.log(`Getting submissions for restaurant ID ${numRestaurantId} (${typeof restaurantId})`);

    const restaurantCampaignIds = Array.from(this.campaigns.values())
      .filter(campaign => Number(campaign.restaurantId) === numRestaurantId)
      .map(campaign => campaign.id);

    console.log(`Found ${restaurantCampaignIds.length} campaigns for restaurant ID ${numRestaurantId}: ${restaurantCampaignIds.join(', ')}`);

    const submissions = Array.from(this.submissions.values())
      .filter(submission => restaurantCampaignIds.includes(Number(submission.campaignId)));

    console.log(`Found ${submissions.length} submissions for restaurant ID ${numRestaurantId}`);

    return submissions;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionIdCounter++;
    const createdAt = new Date();
    const submission: Submission = { 
      ...insertSubmission, 
      id, 
      views: 0,
      likes: 0,
      earnings: 0,
      createdAt,
      notes: insertSubmission.notes || null
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmission(id: number, submissionUpdate: Partial<Submission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission = { ...submission, ...submissionUpdate };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  // Private Invitation methods
  async getPrivateInvitation(id: number): Promise<PrivateInvitation | undefined> {
    return this.privateInvitations.get(id);
  }

  async getPrivateInvitationByCode(inviteCode: string): Promise<PrivateInvitation | undefined> {
    return Array.from(this.privateInvitations.values()).find(
      (invitation) => invitation.inviteCode === inviteCode
    );
  }

  async getPrivateInvitationsByRestaurantId(restaurantId: number): Promise<PrivateInvitation[]> {
    return Array.from(this.privateInvitations.values())
      .filter((invitation) => Number(invitation.restaurantId) === Number(restaurantId));
  }

  async getPrivateInvitationsByInfluencerId(influencerId: number): Promise<PrivateInvitation[]> {
    return Array.from(this.privateInvitations.values())
      .filter((invitation) => Number(invitation.influencerId) === Number(influencerId));
  }

  async createPrivateInvitation(insertInvitation: InsertPrivateInvitation): Promise<PrivateInvitation> {
    const id = this.privateInvitationIdCounter++;
    const createdAt = new Date();
    const inviteCode = crypto.randomUUID();

    const invitation: PrivateInvitation = {
      ...insertInvitation,
      id,
      inviteCode,
      createdAt,
      imageUrl: insertInvitation.imageUrl || null,
      expiresAt: insertInvitation.expiresAt || null
    };

    this.privateInvitations.set(id, invitation);
    return invitation;
  }

  async updatePrivateInvitation(id: number, invitationUpdate: Partial<PrivateInvitation>): Promise<PrivateInvitation | undefined> {
    const invitation = this.privateInvitations.get(id);
    if (!invitation) return undefined;

    const updatedInvitation = { ...invitation, ...invitationUpdate };
    this.privateInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async deletePrivateInvitation(id: number): Promise<boolean> {
    return this.privateInvitations.delete(id);
  }

  // Private Submission methods
  async getPrivateSubmission(id: number): Promise<PrivateSubmission | undefined> {
    return this.privateSubmissions.get(id);
  }

  async getPrivateSubmissionsByInvitationId(invitationId: number): Promise<PrivateSubmission[]> {
    return Array.from(this.privateSubmissions.values())
      .filter((submission) => Number(submission.invitationId) === Number(invitationId));
  }

  async createPrivateSubmission(insertSubmission: InsertPrivateSubmission): Promise<PrivateSubmission> {
    const id = this.privateSubmissionIdCounter++;
    const createdAt = new Date();

    const submission: PrivateSubmission = {
      ...insertSubmission,
      id,
      views: 0,
      likes: 0,
      earnings: 0,
      createdAt,
      notes: insertSubmission.notes || null
    };

    this.privateSubmissions.set(id, submission);
    return submission;
  }

  async updatePrivateSubmission(id: number, submissionUpdate: Partial<PrivateSubmission>): Promise<PrivateSubmission | undefined> {
    const submission = this.privateSubmissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission = { ...submission, ...submissionUpdate };
    this.privateSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  // Performance Metrics methods
  async getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined> {
    return this.performanceMetrics.get(id);
  }

  async getPerformanceMetricsBySubmissionId(submissionId: number): Promise<PerformanceMetric[]> {
    return Array.from(this.performanceMetrics.values())
      .filter((metric) => Number(metric.submissionId) === Number(submissionId))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by most recent
  }

  async createPerformanceMetric(insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const id = this.performanceMetricIdCounter++;
    const updatedAt = new Date();

    const metric: PerformanceMetric = {
      ...insertMetric,
      id,
      updatedAt
    };

    this.performanceMetrics.set(id, metric);

    // Update the submission with the latest metrics and earnings
    const submission = await this.getSubmission(insertMetric.submissionId);
    if (submission) {
      await this.updateSubmission(submission.id, {
        views: insertMetric.viewCount,
        likes: insertMetric.likeCount,
        earnings: insertMetric.calculatedEarnings
      });
    }

    return metric;
  }

  // Private Performance Metrics methods
  async getPrivatePerformanceMetric(id: number): Promise<PrivatePerformanceMetric | undefined> {
    return this.privatePerformanceMetrics.get(id);
  }

  async getPrivatePerformanceMetricsBySubmissionId(privateSubmissionId: number): Promise<PrivatePerformanceMetric[]> {
    return Array.from(this.privatePerformanceMetrics.values())
      .filter((metric) => Number(metric.privateSubmissionId) === Number(privateSubmissionId))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by most recent
  }

  async createPrivatePerformanceMetric(insertMetric: InsertPrivatePerformanceMetric): Promise<PrivatePerformanceMetric> {
    const id = this.privatePerformanceMetricIdCounter++;
    const updatedAt = new Date();

    const metric: PrivatePerformanceMetric = {
      ...insertMetric,
      id,
      updatedAt
    };

    this.privatePerformanceMetrics.set(id, metric);

    // Update the private submission with the latest metrics and earnings
    const submission = await this.getPrivateSubmission(insertMetric.privateSubmissionId);
    if (submission) {
      await this.updatePrivateSubmission(submission.id, {
        views: insertMetric.viewCount,
        likes: insertMetric.likeCount,
        earnings: insertMetric.calculatedEarnings
      });
    }

    return metric;
  }
}

export class DatabaseStorage implements IStorage {
  // Maps are used only to maintain API compatibility with the interface
  // These maps do not actually store data, but are required by the interface
  users: Map<number, User> = new Map();
  campaigns: Map<number, Campaign> = new Map();
  submissions: Map<number, Submission> = new Map();
  privateInvitations: Map<number, PrivateInvitation> = new Map();
  privateSubmissions: Map<number, PrivateSubmission> = new Map();
  performanceMetrics: Map<number, PerformanceMetric> = new Map();
  privatePerformanceMetrics: Map<number, PrivatePerformanceMetric> = new Map();

  sessionStore: session.Store;

  constructor() {
    // Use MemoryStore for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h, clear expired entries
    });

    // No in-memory data initialization as data is stored in the database
    console.log("Using persistent database storage for all data");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error retrieving user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error retrieving user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error retrieving user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userUpdate)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  // Campaign methods
  async getCampaign(id: number): Promise<Campaign | undefined> {
    try {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
      return campaign;
    } catch (error) {
      console.error("Error retrieving campaign:", error);
      return undefined;
    }
  }

  async getCampaigns(): Promise<Campaign[]> {
    try {
      return await db.select().from(campaigns);
    } catch (error) {
      console.error("Error retrieving all campaigns:", error);
      return [];
    }
  }

  async getCampaignsByRestaurantId(restaurantId: number): Promise<Campaign[]> {
    try {
      // Ensure restaurantId is a number
      const numRestaurantId = Number(restaurantId);
      console.log(`Getting campaigns for restaurant ID ${numRestaurantId} (${typeof restaurantId})`);

      const result = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.restaurantId, numRestaurantId));

      console.log(`Found ${result.length} campaigns for restaurant ID ${numRestaurantId}`);
      if (result.length > 0) {
        console.log("Restaurant campaigns:", result.map(c => ({id: c.id, title: c.title, restaurantId: c.restaurantId})));
      } else {
        console.log("No campaigns found for this restaurant.");
      }

      return result;
    } catch (error) {
      console.error(`Error retrieving campaigns for restaurant ${restaurantId}:`, error);
      return [];
    }
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const activeCampaigns = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, "active"));

      console.log(`Found ${activeCampaigns.length} active campaigns`);
      return activeCampaigns;
    } catch (error) {
      console.error("Error retrieving active campaigns:", error);
      return [];
    }
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const allCampaigns = await db
        .select()
        .from(campaigns);

      console.log(`Found ${allCampaigns.length} total campaigns`);
      return allCampaigns;
    } catch (error) {
      console.error("Error retrieving all campaigns:", error);
      return [];
    }
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    try {
      // Ensure restaurantId is a number
      const numRestaurantId = Number(insertCampaign.restaurantId);

      console.log(`Creating campaign for restaurant ${numRestaurantId} (original type: ${typeof insertCampaign.restaurantId})`);

      // Create campaign with all data normalized
      const campaignData = {
        ...insertCampaign,
        restaurantId: numRestaurantId,
        location: insertCampaign.location || null,
        maxPayoutPerInfluencer: insertCampaign.maxPayoutPerInfluencer || null,
        maxBudget: insertCampaign.maxBudget || null
      };

      const [campaign] = await db
        .insert(campaigns)
        .values(campaignData)
        .returning();

      console.log(`Created campaign with ID ${campaign.id} for restaurant ${campaign.restaurantId}`);

      // Verify the campaign can be retrieved by restaurant ID
      const restaurantCampaigns = await this.getCampaignsByRestaurantId(numRestaurantId);
      console.log(`Verification: Restaurant ${numRestaurantId} has ${restaurantCampaigns.length} campaigns after creation`);

      return campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }

  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    try {
      // Ensure restaurantId is a number if it's being updated
      if (campaignUpdate.restaurantId) {
        campaignUpdate.restaurantId = Number(campaignUpdate.restaurantId);
      }

      const [updatedCampaign] = await db
        .update(campaigns)
        .set(campaignUpdate)
        .where(eq(campaigns.id, id))
        .returning();

      return updatedCampaign;
    } catch (error) {
      console.error(`Error updating campaign ${id}:`, error);
      return undefined;
    }
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(campaigns)
        .where(eq(campaigns.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting campaign ${id}:`, error);
      return false;
    }
  }

  // Submission methods
  async getSubmission(id: number): Promise<Submission | undefined> {
    try {
      const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
      return submission;
    } catch (error) {
      console.error(`Error retrieving submission ${id}:`, error);
      return undefined;
    }
  }

  async getSubmissions(): Promise<Submission[]> {
    try {
      return await db.select().from(submissions);
    } catch (error) {
      console.error("Error retrieving all submissions:", error);
      return [];
    }
  }

  async getSubmissionsByCampaignId(campaignId: number): Promise<Submission[]> {
    try {
      const numCampaignId = Number(campaignId);
      return await db
        .select()
        .from(submissions)
        .where(eq(submissions.campaignId, numCampaignId));
    } catch (error) {
      console.error(`Error retrieving submissions for campaign ${campaignId}:`, error);
      return [];
    }
  }

  async getSubmissionsByInfluencerId(influencerId: number): Promise<Submission[]> {
    try {
      const numInfluencerId = Number(influencerId);
      return await db
        .select()
        .from(submissions)
        .where(eq(submissions.influencerId, numInfluencerId));
    } catch (error) {
      console.error(`Error retrieving submissions for influencer ${influencerId}:`, error);
      return [];
    }
  }

  async getSubmissionsByRestaurantId(restaurantId: number): Promise<Submission[]> {
    try {
      // Use Number conversion for consistent comparison
      const numRestaurantId = Number(restaurantId);
      console.log(`Getting submissions for restaurant ID ${numRestaurantId} (${typeof restaurantId})`);

      // First get all campaigns belonging to the restaurant
      const restaurantCampaigns = await this.getCampaignsByRestaurantId(numRestaurantId);

      if (restaurantCampaigns.length === 0) {
        console.log(`No campaigns found for restaurant ${numRestaurantId}`);
        return [];
      }

      // Get all campaign IDs
      const campaignIds = restaurantCampaigns.map(campaign => campaign.id);
      console.log(`Found ${campaignIds.length} campaigns for restaurant ID ${numRestaurantId}: ${campaignIds.join(', ')}`);

      // Get all submissions for those campaigns
      const result = await db
        .select()
        .from(submissions)
        .where(inArray(submissions.campaignId, campaignIds));

      console.log(`Found ${result.length} submissions for restaurant ID ${numRestaurantId}`);
      return result;
    } catch (error) {
      console.error(`Error retrieving submissions for restaurant ${restaurantId}:`, error);
      return [];
    }
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    try {
      // Ensure IDs are numbers
      const numCampaignId = Number(insertSubmission.campaignId);
      const numInfluencerId = Number(insertSubmission.influencerId);

      const submissionData = {
        ...insertSubmission,
        campaignId: numCampaignId,
        influencerId: numInfluencerId,
        notes: insertSubmission.notes || null
      };

      const [submission] = await db
        .insert(submissions)
        .values({
          ...submissionData,
          views: 0,
          likes: 0,
          earnings: 0
        })
        .returning();

      return submission;
    } catch (error) {
      console.error("Error creating submission:", error);
      throw error;
    }
  }

  async updateSubmission(id: number, submissionUpdate: Partial<Submission>): Promise<Submission | undefined> {
    try {
      // Convert IDs to numbers if present
      if (submissionUpdate.campaignId) {
        submissionUpdate.campaignId = Number(submissionUpdate.campaignId);
      }
      if (submissionUpdate.influencerId) {
        submissionUpdate.influencerId = Number(submissionUpdate.influencerId);
      }

      const [updatedSubmission] = await db
        .update(submissions)
        .set(submissionUpdate)
        .where(eq(submissions.id, id))
        .returning();

      return updatedSubmission;
    } catch (error) {
      console.error(`Error updating submission ${id}:`, error);
      return undefined;
    }
  }

  // Private Invitation methods
  async getPrivateInvitation(id: number): Promise<PrivateInvitation | undefined> {
    try {const [invitation] = await db.select().from(privateInvitations).where(eq(privateInvitations.id, id));
      return invitation;
    } catch (error) {
      console.error(`Error retrieving private invitation ${id}:`, error);
      return undefined;
    }
  }

  async getPrivateInvitationByCode(inviteCode: string): Promise<PrivateInvitation | undefined> {
    try {
      const [invitation] = await db
        .select()
        .from(privateInvitations)
        .where(eq(privateInvitations.inviteCode, inviteCode));
      return invitation;
    } catch (error) {
      console.error(`Error retrieving private invitation by code ${inviteCode}:`, error);
      return undefined;
    }
  }

  async getPrivateInvitationsByRestaurantId(restaurantId: number): Promise<PrivateInvitation[]> {
    try {
      const numRestaurantId = Number(restaurantId);
      return await db
        .select()
        .from(privateInvitations)
        .where(eq(privateInvitations.restaurantId, numRestaurantId));
    } catch (error) {
      console.error(`Error retrieving private invitations for restaurant ${restaurantId}:`, error);
      return [];
    }
  }

  async getPrivateInvitationsByInfluencerId(influencerId: number): Promise<PrivateInvitation[]> {
    try {
      const numInfluencerId = Number(influencerId);
      return await db
        .select()
        .from(privateInvitations)
        .where(eq(privateInvitations.influencerId, numInfluencerId));
    } catch (error) {
      console.error(`Error retrieving private invitations for influencer ${influencerId}:`, error);
      return [];
    }
  }

  async createPrivateInvitation(insertInvitation: InsertPrivateInvitation): Promise<PrivateInvitation> {
    try {
      // Ensure IDs are numbers
      const numRestaurantId = Number(insertInvitation.restaurantId);
      const numInfluencerId = Number(insertInvitation.influencerId);

      const invitationData = {
        ...insertInvitation,
        restaurantId: numRestaurantId,
        influencerId: numInfluencerId,
        imageUrl: insertInvitation.imageUrl || null
      };

      const [invitation] = await db
        .insert(privateInvitations)
        .values(invitationData)
        .returning();

      return invitation;
    } catch (error) {
      console.error("Error creating private invitation:", error);
      throw error;
    }
  }

  async updatePrivateInvitation(id: number, invitationUpdate: Partial<PrivateInvitation>): Promise<PrivateInvitation | undefined> {
    try {
      // Convert IDs to numbers if present
      if (invitationUpdate.restaurantId) {
        invitationUpdate.restaurantId = Number(invitationUpdate.restaurantId);
      }
      if (invitationUpdate.influencerId) {
        invitationUpdate.influencerId = Number(invitationUpdate.influencerId);
      }

      const [updatedInvitation] = await db
        .update(privateInvitations)
        .set(invitationUpdate)
        .where(eq(privateInvitations.id, id))
        .returning();

      return updatedInvitation;
    } catch (error) {
      console.error(`Error updating private invitation ${id}:`, error);
      return undefined;
    }
  }

  async deletePrivateInvitation(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(privateInvitations)
        .where(eq(privateInvitations.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting private invitation ${id}:`, error);
      return false;
    }
  }

  // Private Submission methods
  async getPrivateSubmission(id: number): Promise<PrivateSubmission | undefined> {
    try {
      const [submission] = await db.select().from(privateSubmissions).where(eq(privateSubmissions.id, id));
      return submission;
    } catch (error) {
      console.error(`Error retrieving private submission ${id}:`, error);
      return undefined;
    }
  }

  async getPrivateSubmissionsByInvitationId(invitationId: number): Promise<PrivateSubmission[]> {
    try {
      const numInvitationId = Number(invitationId);
      return await db
        .select()
        .from(privateSubmissions)
        .where(eq(privateSubmissions.invitationId, numInvitationId));
    } catch (error) {
      console.error(`Error retrieving private submissions for invitation ${invitationId}:`, error);
      return [];
    }
  }

  async createPrivateSubmission(insertSubmission: InsertPrivateSubmission): Promise<PrivateSubmission> {
    try {
      // Ensure invitationId is a number
      const numInvitationId = Number(insertSubmission.invitationId);

      const submissionData = {
        ...insertSubmission,
        invitationId: numInvitationId,
        notes: insertSubmission.notes || null
      };

      const [submission] = await db
        .insert(privateSubmissions)
        .values({
          ...submissionData,
          views: 0,
          likes: 0,
          earnings: 0
        })
        .returning();

      return submission;
    } catch (error) {
      console.error("Error creating private submission:", error);
      throw error;
    }
  }

  async updatePrivateSubmission(id: number, submissionUpdate: Partial<PrivateSubmission>): Promise<PrivateSubmission | undefined> {
    try {
      // Convert invitationId to number if present
      if (submissionUpdate.invitationId) {
        submissionUpdate.invitationId = Number(submissionUpdate.invitationId);
      }

      const [updatedSubmission] = await db
        .update(privateSubmissions)
        .set(submissionUpdate)
        .where(eq(privateSubmissions.id, id))
        .returning();

      return updatedSubmission;
    } catch (error) {
      console.error(`Error updating private submission ${id}:`, error);
      return undefined;
    }
  }

  // Performance Metrics methods
  async getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined> {
    try {
      const [metric] = await db.select().from(performanceMetrics).where(eq(performanceMetrics.id, id));
      return metric;
    } catch (error) {
      console.error(`Error retrieving performance metric ${id}:`, error);
      return undefined;
    }
  }

  async getPerformanceMetricsBySubmissionId(submissionId: number): Promise<PerformanceMetric[]> {
    try {
      const numSubmissionId = Number(submissionId);
      return await db
        .select()
        .from(performanceMetrics)
        .where(eq(performanceMetrics.submissionId, numSubmissionId));
    } catch (error) {
      console.error(`Error retrieving performance metrics for submission ${submissionId}:`, error);
      return [];
    }
  }

  async createPerformanceMetric(insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    try {
      // Ensure IDs are numbers
      const numSubmissionId = Number(insertMetric.submissionId);
      const numUpdatedBy = Number(insertMetric.updatedBy);

      const metricData = {
        ...insertMetric,
        submissionId: numSubmissionId,
        updatedBy: numUpdatedBy
      };

      const [metric] = await db
        .insert(performanceMetrics)
        .values(metricData)
        .returning();

      return metric;
    } catch (error) {
      console.error("Error creating performance metric:", error);
      throw error;
    }
  }

  // Private Performance Metrics methods
  async getPrivatePerformanceMetric(id: number): Promise<PrivatePerformanceMetric | undefined> {
    try {
      const [metric] = await db.select().from(privatePerformanceMetrics).where(eq(privatePerformanceMetrics.id, id));
      return metric;
    } catch (error) {
      console.error(`Error retrieving private performance metric ${id}:`, error);
      return undefined;
    }
  }

  async getPrivatePerformanceMetricsBySubmissionId(privateSubmissionId: number): Promise<PrivatePerformanceMetric[]> {
    try {
      const numSubmissionId = Number(privateSubmissionId);
      return await db
        .select()
        .from(privatePerformanceMetrics)
        .where(eq(privatePerformanceMetrics.privateSubmissionId, numSubmissionId));
    } catch (error) {
      console.error(`Error retrieving private performance metrics for submission ${privateSubmissionId}:`, error);
      return [];
    }
  }

  async createPrivatePerformanceMetric(insertMetric: InsertPrivatePerformanceMetric): Promise<PrivatePerformanceMetric> {
    try {
      // Ensure IDs are numbers
      const numSubmissionId = Number(insertMetric.privateSubmissionId);
      const numUpdatedBy = Number(insertMetric.updatedBy);

      const metricData = {
        ...insertMetric,
        privateSubmissionId: numSubmissionId,
        updatedBy: numUpdatedBy
      };

      const [metric] = await db
        .insert(privatePerformanceMetrics)
        .values(metricData)
        .returning();

      return metric;
    } catch (error) {
      console.error("Error creating private performance metric:", error);
      throw error;
    }
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();