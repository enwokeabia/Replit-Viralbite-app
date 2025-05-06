import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { InsertUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// This file creates sample data for testing the application
async function createSampleData() {
  try {
    console.log("Creating sample data for testing...");
    
    // Check if data already exists
    const users = await storage.getCampaigns();
    if (users.length > 0) {
      console.log("Data already exists in the database. Skipping sample data creation.");
      return;
    }
    
    // Create test users
    console.log("Creating test users...");
    const hashedPassword = await hashPassword("Password");
    
    const adminUser = await createUserIfNotExists({
      username: "Admin",
      password: hashedPassword,
      name: "Administrator",
      email: "admin@viralbite.com",
      role: "admin",
    });
    
    const restaurant1User = await createUserIfNotExists({
      username: "johnjones",
      password: hashedPassword,
      name: "John Jones Burgers",
      email: "john@jjburgers.com",
      role: "restaurant",
    });
    
    const influencerUser = await createUserIfNotExists({
      username: "Janet",
      password: hashedPassword,
      name: "Janet Food Blogger",
      email: "janet@foodblog.com",
      role: "influencer",
    });
    
    const restaurant2User = await createUserIfNotExists({
      username: "restaurant2",
      password: hashedPassword,
      name: "Second Test Restaurant",
      email: "test@restaurant2.com",
      role: "restaurant",
    });
    
    // Create sample campaigns for Restaurant 1
    console.log("Creating campaigns for Restaurant 1...");
    const campaign1 = await storage.createCampaign({
      restaurantId: restaurant1User.id,
      title: "Burger Promo Campaign",
      description: "We're looking for influencers to promote our new burger lineup. Required to show food in detail and mention our special sauce.",
      location: "New York City",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop",
      rewardAmount: 50,
      rewardViews: 10000,
      maxPayoutPerInfluencer: 300,
      maxBudget: 3000
    });
    
    const campaign2 = await storage.createCampaign({
      restaurantId: restaurant1User.id,
      title: "Dessert Feature",
      description: "Feature our new ice cream sundae in your content. Must show full dessert and mention our house-made toppings.",
      location: "New York City",
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=1000&auto=format&fit=crop",
      rewardAmount: 40,
      rewardViews: 5000,
      maxPayoutPerInfluencer: 200,
      maxBudget: 2000
    });
    
    // Create sample campaign for Restaurant 2
    console.log("Creating campaign for Restaurant 2...");
    const campaign3 = await storage.createCampaign({
      restaurantId: restaurant2User.id,
      title: "Pizza Promotion",
      description: "We want food influencers to feature our signature deep dish pizza. Must show the cheese pull!",
      location: "Chicago",
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1000&auto=format&fit=crop",
      rewardAmount: 60,
      rewardViews: 15000,
      maxPayoutPerInfluencer: 240,
      maxBudget: 2400,
      status: "active"
    });
    
    // Create a test submission
    console.log("Creating sample submissions...");
    const submission1 = await storage.createSubmission({
      campaignId: campaign1.id,
      influencerId: influencerUser.id,
      instagramUrl: "https://www.instagram.com/p/sample1",
      notes: "Posted about the amazing burger, users loved it!",
      status: "approved"
    });
    
    // Add performance metrics to submission
    await storage.updateSubmission(submission1.id, {
      views: 12500,
      likes: 850,
      earnings: 50 // $50 for 10,000 views
    });
    
    // Create a sample private invitation
    console.log("Creating private invitations...");
    const privateInvitation1 = await storage.createPrivateInvitation({
      restaurantId: restaurant1User.id,
      influencerId: influencerUser.id,
      title: "Exclusive Drink Feature",
      description: "We'd like you to feature our new signature cocktail in your content.",
      imageUrl: "https://images.unsplash.com/photo-1605270012917-bf357a1fae9e?q=80&w=1000&auto=format&fit=crop",
      rewardAmount: 100,
      rewardViews: 20000,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Create performance metrics
    console.log("Creating performance metrics...");
    const performanceMetric = await storage.createPerformanceMetric({
      submissionId: submission1.id,
      viewCount: 12500,
      likeCount: 850,
      calculatedEarnings: 50,
      updatedBy: adminUser.id
    });
    
    console.log("Sample data created successfully:");
    console.log("- Users:", adminUser.id, restaurant1User.id, influencerUser.id, restaurant2User.id);
    console.log("- Campaigns:", campaign1.id, campaign2.id, campaign3.id);
    console.log("- Submissions:", submission1.id);
    console.log("- Private Invitations:", privateInvitation1.id);
    console.log("- Performance Metrics:", performanceMetric.id);
    
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

// Helper function to create a user if they don't exist
async function createUserIfNotExists(userData: InsertUser) {
  const existingUser = await storage.getUserByUsername(userData.username);
  if (existingUser) {
    console.log(`User ${userData.username} already exists.`);
    return existingUser;
  }
  
  const newUser = await storage.createUser(userData);
  console.log(`Created user: ${newUser.username}`);
  return newUser;
}

// Run the function
createSampleData();