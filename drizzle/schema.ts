import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Projects table
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  synopsis: text("synopsis"),
  status: mysqlEnum("status", [
    "CREATED",
    "STRUCTURED",
    "PROMPTS_GENERATED",
    "STORYBOARD_GENERATED",
    "NARRATION_GENERATED",
    "VIDEO_GENERATED",
    "COMPLETED",
    "FAILED"
  ]).default("CREATED").notNull(),
  finalVideoUrl: varchar("finalVideoUrl", { length: 500 }),
  finalVideoStorageKey: varchar("finalVideoStorageKey", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Scenes table
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneNumber: int("sceneNumber").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  dialogue: text("dialogue"),
  visualElements: json("visualElements"),
  mood: varchar("mood", { length: 100 }),
  durationSeconds: int("durationSeconds"),
  videoPrompt: text("videoPrompt"),
  imagePrompt: text("imagePrompt"),
  styleParameters: json("styleParameters"),
  storyboardImageUrl: varchar("storyboardImageUrl", { length: 500 }),
  storyboardStorageKey: varchar("storyboardStorageKey", { length: 255 }),
  narrationAudioUrl: varchar("narrationAudioUrl", { length: 500 }),
  narrationStorageKey: varchar("narrationStorageKey", { length: 255 }),
  videoClipUrl: varchar("videoClipUrl", { length: 500 }),
  videoStorageKey: varchar("videoStorageKey", { length: 255 }),
  status: mysqlEnum("sceneStatus", [
    "PENDING",
    "PROMPTS_READY",
    "STORYBOARD_GENERATED",
    "NARRATION_GENERATED",
    "VIDEO_GENERATED",
    "COMPLETED"
  ]).default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

// Project inputs table
export const projectInputs = mysqlTable("projectInputs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userIdea: text("userIdea"),
  referenceImageUrl: varchar("referenceImageUrl", { length: 500 }),
  referenceImageStorageKey: varchar("referenceImageStorageKey", { length: 255 }),
  numClips: int("numClips").notNull(),
  clipDurationSeconds: int("clipDurationSeconds").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectInput = typeof projectInputs.$inferSelect;
export type InsertProjectInput = typeof projectInputs.$inferInsert;

// Generation history table
export const generationHistory = mysqlTable("generationHistory", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  stage: varchar("stage", { length: 100 }).notNull(),
  status: mysqlEnum("historyStatus", ["STARTED", "IN_PROGRESS", "COMPLETED", "FAILED"]).notNull(),
  progressPercentage: int("progressPercentage").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertGenerationHistory = typeof generationHistory.$inferInsert;