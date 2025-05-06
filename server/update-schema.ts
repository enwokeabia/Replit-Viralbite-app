import { db, pool } from "./db";
import { sql } from "drizzle-orm";

async function updateSchema() {
  try {
    console.log("Starting schema update...");
    
    // Remove status column from campaigns table
    await db.execute(sql`ALTER TABLE campaigns DROP COLUMN IF EXISTS status`);
    console.log("Removed status column from campaigns table");
    
    console.log("Schema update completed successfully!");
  } catch (error) {
    console.error("Error updating schema:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the update
updateSchema();