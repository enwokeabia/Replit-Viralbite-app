import { storage } from "./storage";

// This file creates sample data for testing the admin dashboard

async function createSampleData() {
  try {
    console.log("Creating sample data for testing...");
    
    // Create a sample campaign
    const campaign = await storage.createCampaign({
      restaurantId: 2, // John Jones (restaurant user)
      title: "Summer Instagram Promotion",
      description: "Looking for food influencers to promote our summer menu. Share your vibrant shots of our seasonal dishes and earn rewards based on engagement!",
      location: "New York, NY",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
      rewardAmount: 50,
      rewardViews: 10000,
      maxPayoutPerInfluencer: 200,
      maxBudget: 2000,
      status: "active"
    });
    
    // Create a sample submission
    const submission = await storage.createSubmission({
      campaignId: campaign.id,
      influencerId: 3, // Janet (influencer user)
      instagramUrl: "https://www.instagram.com/p/sample-post-1/",
      status: "approved",
      notes: "Great content, well-lit photos, and good engagement"
    });
    
    // Create a sample private invitation
    const invitation = await storage.createPrivateInvitation({
      restaurantId: 2, // John Jones
      influencerId: 3, // Janet
      title: "Exclusive Fall Menu Preview",
      description: "We'd love to have you showcase our exclusive fall menu items before anyone else! Great opportunity for exclusive content.",
      rewardAmount: 100,
      rewardViews: 5000,
      status: "pending", // Add the required status field
      imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    // Create a sample private submission
    const privateSubmission = await storage.createPrivateSubmission({
      invitationId: invitation.id,
      instagramUrl: "https://www.instagram.com/p/sample-private-post-1/",
      status: "approved",
      notes: "Excellent presentation of our signature fall dishes"
    });
    
    // Add sample performance metrics
    const performanceMetric = await storage.createPerformanceMetric({
      submissionId: submission.id,
      viewCount: 15000,
      likeCount: 1200,
      calculatedEarnings: (15000 / campaign.rewardViews) * campaign.rewardAmount,
      updatedBy: 1 // Admin user
    });
    
    const privatePerformanceMetric = await storage.createPrivatePerformanceMetric({
      privateSubmissionId: privateSubmission.id,
      viewCount: 8000,
      likeCount: 900,
      calculatedEarnings: (8000 / invitation.rewardViews) * invitation.rewardAmount,
      updatedBy: 1 // Admin user
    });
    
    console.log("Sample data created successfully:");
    console.log("- Campaign:", campaign.id);
    console.log("- Submission:", submission.id);
    console.log("- Private Invitation:", invitation.id);
    console.log("- Private Submission:", privateSubmission.id);
    console.log("- Performance Metric:", performanceMetric.id);
    console.log("- Private Performance Metric:", privatePerformanceMetric.id);
    
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

// Run the function
createSampleData();