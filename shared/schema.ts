import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["restaurant", "influencer"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Campaign schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  rewardAmount: doublePrecision("reward_amount").notNull(),
  rewardViews: integer("reward_views").notNull(),
  maxPayoutPerInfluencer: doublePrecision("max_payout_per_influencer"),
  maxBudget: doublePrecision("max_budget"),
  status: text("status", { enum: ["draft", "active", "ended"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create the schema with additional validation
export const insertCampaignSchema = z.object({
  restaurantId: z.number(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().min(1, "Image URL is required"),
  rewardAmount: z.coerce.number().min(1, "Amount must be at least $1"),
  rewardViews: z.coerce.number().min(100, "Views must be at least 100"),
  maxPayoutPerInfluencer: z.coerce.number().min(1, "Max payout must be at least $1").optional(),
  maxBudget: z.coerce.number().min(1, "Budget must be at least $1").optional(),
  status: z.enum(["draft", "active", "ended"]),
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Submission schema
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  influencerId: integer("influencer_id").notNull().references(() => users.id),
  instagramUrl: text("instagram_url").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull(),
  views: integer("views").default(0).notNull(),
  earnings: doublePrecision("earnings").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  views: true,
  earnings: true,
  createdAt: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// ViewUpdate schema for updating views and calculating earnings
export const viewUpdateSchema = z.object({
  submissionId: z.number(),
  views: z.number().min(0),
});

export type ViewUpdate = z.infer<typeof viewUpdateSchema>;
