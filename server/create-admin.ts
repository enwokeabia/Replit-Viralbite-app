import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername("Admin");
    
    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }
    
    // Create the admin user
    const adminUser = await storage.createUser({
      username: "Admin",
      password: await hashPassword("Password"),
      name: "Administrator",
      email: "admin@viralbite.com",
      role: "admin",
    });
    
    console.log("Admin user created successfully:", adminUser);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Execute the function
createAdminUser();