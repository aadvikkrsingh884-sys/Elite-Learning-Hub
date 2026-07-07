import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const importantQuestionsTable = pgTable("important_questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter").notNull(),
  classLevel: integer("class_level").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  frequency: text("frequency").notNull().default("Common Question"),
  solution: text("solution").notNull(),
  tags: text("tags").notNull().default("[]"),
  year: text("year"),
});

export const insertImportantQuestionSchema = createInsertSchema(importantQuestionsTable).omit({ id: true });
export type InsertImportantQuestion = z.infer<typeof insertImportantQuestionSchema>;
export type ImportantQuestion = typeof importantQuestionsTable.$inferSelect;
