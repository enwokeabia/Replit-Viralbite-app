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
    // Get all campaigns and perform strict equality check on restaurantId
    const campaigns = Array.from(this.campaigns.values())
      .filter((campaign) => {
        const matches = campaign.restaurantId === restaurantId;
        console.log(`Campaign ID ${campaign.id}, Restaurant ID ${campaign.restaurantId}, Requested ID ${restaurantId}, Match: ${matches}`);
        return matches;
      });
    
    console.log(`Found ${campaigns.length} campaigns for restaurant ID ${restaurantId}`);
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
