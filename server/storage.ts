import { users, type User, type InsertUser, 
  campaigns, type Campaign, type InsertCampaign, 
  submissions, type Submission, type InsertSubmission,
  privateInvitations, type PrivateInvitation, type InsertPrivateInvitation,
  privateSubmissions, type PrivateSubmission, type InsertPrivateSubmission
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
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private campaigns: Map<number, Campaign>;
  private submissions: Map<number, Submission>;
  private privateInvitations: Map<number, PrivateInvitation>;
  private privateSubmissions: Map<number, PrivateSubmission>;
  private userIdCounter: number;
  private campaignIdCounter: number;
  private submissionIdCounter: number;
  private privateInvitationIdCounter: number;
  private privateSubmissionIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.campaigns = new Map();
    this.submissions = new Map();
    this.privateInvitations = new Map();
    this.privateSubmissions = new Map();
    this.userIdCounter = 1;
    this.campaignIdCounter = 1;
    this.submissionIdCounter = 1;
    this.privateInvitationIdCounter = 1;
    this.privateSubmissionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h, clear expired entries
    });
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
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
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
    const id = this.campaignIdCounter++;
    const createdAt = new Date();
    const campaign: Campaign = { ...insertCampaign, id, createdAt };
    this.campaigns.set(id, campaign);
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
      earnings: 0,
      createdAt 
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
      earnings: 0,
      createdAt,
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
}

export const storage = new MemStorage();
