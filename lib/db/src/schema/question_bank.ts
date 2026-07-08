import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chaptersTable } from "./subjects";

// Chapter-level practice question bank — distinct from `tests`/`questions`
// (which are timed, test-scoped). These are always-available untimed practice
// questions attached directly to a chapter, mixing MCQ and descriptive types.
export const questionBankTable = pgTable("question_bank", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => chaptersTable.id),
  text: text("text").notNull(),
  type: text("type").notNull().default("multiple_choice"), // "multiple_choice" | "descriptive"
  difficulty: text("difficulty").notNull().default("medium"), // "easy" | "medium" | "hard"
  optionA: text("option_a"),
  optionB: text("option_b"),
  optionC: text("option_c"),
  optionD: text("option_d"),
  correctOption: integer("correct_option"), // 1-4, null for descriptive
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionBankSchema = createInsertSchema(questionBankTable).omit({ id: true, createdAt: true });
export type InsertQuestionBankItem = z.infer<typeof insertQuestionBankSchema>;
export type QuestionBankItem = typeof questionBankTable.$inferSelect;
