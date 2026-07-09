import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable, chaptersTable } from "./subjects";

// Downloadable study resources attached to subjects/chapters.
// resource_type maps to a specific kind of educational asset.
export const RESOURCE_TYPES = [
  "PYQ",          // Previous Year Questions
  "TopperNote",   // Topper's hand-written notes
  "VIPNote",      // VIP Teacher's notes
  "CheatSheet",   // Quick-reference cheat sheet
  "SamplePaper",  // Sample examination paper
  "RevisionNote", // Rapid revision notes
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];

export const studyResourcesTable = pgTable("study_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  resourceType: text("resource_type").notNull(), // ResourceType enum
  classId: integer("class_id").notNull(),         // 6-10
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id),
  chapterId: integer("chapter_id").references(() => chaptersTable.id), // null = subject-level
  fileUrl: text("file_url"),                       // external URL or null (server generates PDF)
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudyResourceSchema = createInsertSchema(studyResourcesTable).omit({ id: true, createdAt: true });
export type InsertStudyResource = z.infer<typeof insertStudyResourceSchema>;
export type StudyResource = typeof studyResourcesTable.$inferSelect;
