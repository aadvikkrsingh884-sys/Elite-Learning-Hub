import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { topicsTable } from "./subjects";

export const progressTable = pgTable("progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  subjectId: integer("subject_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  topicId: integer("topic_id").references(() => topicsTable.id),
  status: text("status").notNull().default("not_started"),
  masteryPercent: integer("mastery_percent").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProgressSchema = createInsertSchema(progressTable).omit({ id: true, updatedAt: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progressTable.$inferSelect;
