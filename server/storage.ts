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

const MemoryStore = createMemoryStore(session);

export interface IStorage {
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
  private users: Map<number, User>;
  private campaigns: Map<number, Campaign>;
  private submissions: Map<number, Submission>;
  private privateInvitations: Map<number, PrivateInvitation>;
  private privateSubmissions: Map<number, PrivateSubmission>;
  private performanceMetrics: Map<number, PerformanceMetric>;
  private privatePerformanceMetrics: Map<number, PrivatePerformanceMetric>;
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
    
    // Initialize the ID counters - start from higher numbers to avoid collisions
    this.userIdCounter = 100;
    this.campaignIdCounter = 100;
    this.submissionIdCounter = 100;
    this.privateInvitationIdCounter = 100;
    this.privateSubmissionIdCounter = 100;
    this.performanceMetricIdCounter = 100;
    this.privatePerformanceMetricIdCounter = 100;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h, clear expired entries
    });
    
    console.log("Initializing in-memory storage with sample data");
    
    // Password is "Password"
    const adminPasswordHash = "ade3e42b3773eabd4c050d7355dfd96e65c89e545a3f040e62d22ce5e86903928cbcf4f4342a12d1c38f87d74d13fd5930940c0c5658e2ed530de62f31e8667d.e16aa36aa6ee2717ced407b074195e04";
    
    // Create admin user for demo/testing purposes
    const adminId = 1;
    const adminUser: User = {
      id: adminId,
      username: "Admin",
      password: adminPasswordHash,
      name: "Administrator",
      email: "admin@viralbite.com",
      role: "admin",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(adminId, adminUser);
    
    // Create test restaurant users
    const restaurantId1 = 2;
    const testRestaurantUser1: User = {
      id: restaurantId1,
      username: "johnjones",
      password: adminPasswordHash, // Same password for testing
      name: "John Jones",
      email: "john@restaurant.com",
      role: "restaurant",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(restaurantId1, testRestaurantUser1);
    
    const restaurantId2 = 3;
    const testRestaurantUser2: User = {
      id: restaurantId2,
      username: "maryresto",
      password: adminPasswordHash, // Same password for testing
      name: "Mary's Restaurant",
      email: "mary@restaurant.com",
      role: "restaurant",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(restaurantId2, testRestaurantUser2);
    
    // Create test influencer user
    const influencerId = 4;
    const testInfluencerUser: User = {
      id: influencerId,
      username: "Janet",
      password: adminPasswordHash, // Same password for testing
      name: "Janet Smith",
      email: "janet@influencer.com",
      role: "influencer",
      profilePicture: null,
      createdAt: new Date()
    };
    this.users.set(influencerId, testInfluencerUser);
    
    // Create test campaigns - one for each restaurant
    const campaign1Id = 1;
    const campaign1: Campaign = {
      id: campaign1Id,
      restaurantId: restaurantId1,
      title: "Burger Promo",
      description: "Promote our new burger menu",
      location: "New York",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      rewardAmount: 50,
      rewardViews: 10000,
      maxPayoutPerInfluencer: 200,
      maxBudget: 1000,
      status: "active",
      createdAt: new Date()
    };
    this.campaigns.set(campaign1Id, campaign1);
    
    const campaign2Id = 2;
    const campaign2: Campaign = {
      id: campaign2Id,
      restaurantId: restaurantId2,
      title: "Sushi Special",
      description: "Promote our sushi chef's special",
      location: "Los Angeles",
      imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      rewardAmount: 40,
      rewardViews: 5000,
      maxPayoutPerInfluencer: 160,
      maxBudget: 800,
      status: "active",
      createdAt: new Date()
    };
    this.campaigns.set(campaign2Id, campaign2);
    
    // Update the counters to be greater than the highest ID used
    this.userIdCounter = Math.max(adminId, restaurantId1, restaurantId2, influencerId) + 1;
    this.campaignIdCounter = Math.max(campaign1Id, campaign2Id) + 1;
    
    console.log(`Initialized storage with ${this.users.size} users and ${this.campaigns.size} campaigns`);
    console.log(`User ID counter: ${this.userIdCounter}, Campaign ID counter: ${this.campaignIdCounter}`);
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
    return Array.from(this.campaigns.values())
      .filter((campaign) => campaign.restaurantId === restaurantId);
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter((campaign) => campaign.status === "active");
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    // Increment the ID counter to ensure we always get a unique ID
    const id = this.campaignIdCounter++;
    const createdAt = new Date();
    
    console.log(`Creating campaign with ID ${id} for restaurant ${insertCampaign.restaurantId}`);
    console.log(`Campaign ID counter is now ${this.campaignIdCounter}`);
    console.log(`Current campaigns in store: ${this.campaigns.size}`);
    
    // Create a campaign with all required fields explicitly assigned
    const campaign: Campaign = {
      id,
      restaurantId: insertCampaign.restaurantId,
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
      .filter((submission) => submission.campaignId === campaignId);
  }

  async getSubmissionsByInfluencerId(influencerId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => submission.influencerId === influencerId);
  }

  async getSubmissionsByRestaurantId(restaurantId: number): Promise<Submission[]> {
    const restaurantCampaignIds = Array.from(this.campaigns.values())
      .filter(campaign => campaign.restaurantId === restaurantId)
      .map(campaign => campaign.id);
    
    return Array.from(this.submissions.values())
      .filter(submission => restaurantCampaignIds.includes(submission.campaignId));
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
      .filter((invitation) => invitation.restaurantId === restaurantId);
  }

  async getPrivateInvitationsByInfluencerId(influencerId: number): Promise<PrivateInvitation[]> {
    return Array.from(this.privateInvitations.values())
      .filter((invitation) => invitation.influencerId === influencerId);
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
      .filter((submission) => submission.invitationId === invitationId);
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
      .filter((metric) => metric.submissionId === submissionId)
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
      .filter((metric) => metric.privateSubmissionId === privateSubmissionId)
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

export const storage = new MemStorage();
