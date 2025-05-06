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

// Helper function to create a user if it doesn't exist
async function createUserIfNotExists(userData: InsertUser) {
  try {
    // Check if the user exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      console.log(`User ${userData.username} already exists with ID ${existingUser.id}`);
      return existingUser;
    }
    
    // Create the user if it doesn't exist
    const newUser = await storage.createUser(userData);
    console.log(`Created new user ${userData.username} with ID ${newUser.id}`);
    return newUser;
  } catch (error) {
    console.error(`Error creating user ${userData.username}:`, error);
    throw error;
  }
}

// This function ensures the required users exist in the database
export async function initializeUsers() {
  try {
    console.log("Initializing required users...");
    
    // Create test users if they don't exist
    const hashedPassword = await hashPassword("Password");
    
    // Ensure admin user exists
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
    
    console.log("User initialization complete");
    
  } catch (error) {
    console.error("Error initializing users:", error);
  }
}

// Export a function to run the initialization
export async function runInitialization() {
  await initializeUsers();
}

// Note: This file is only meant to be imported, not run directly as a module