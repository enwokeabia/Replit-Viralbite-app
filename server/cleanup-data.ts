
import { storage } from "./storage";

async function cleanupDatabase() {
  try {
    console.log("Starting database cleanup...");
    
    // Get all users and campaigns
    const users = await storage.getUsers();
    const campaigns = await storage.getCampaigns();
    
    // Delete all campaigns first (due to foreign key constraints)
    console.log("Deleting campaigns...");
    for (const campaign of campaigns) {
      await storage.deleteCampaign(campaign.id);
    }
    
    // Delete all users
    console.log("Deleting users...");
    for (const user of users) {
      await storage.deleteUser(user.id);
    }
    
    console.log("Database cleanup completed successfully");
  } catch (error) {
    console.error("Error during database cleanup:", error);
  }
}

// Execute the cleanup
cleanupDatabase();
