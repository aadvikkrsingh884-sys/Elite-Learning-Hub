import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";

export const testsTable = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id),
  classLevel: integer("class_level").notNull(),
  totalQuestions: integer("total_questions").notNull().default(20),
  duration: integer("duration").notNull().default(25),
  difficulty: text("difficulty").notNull().default("medium"),
  level: text("level").notNull().default("starting"),
  chapterName: text("chapter_name"),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => testsTable.id),
  text: text("text").notNull(),
  type: text("type").notNull().default("multiple_choice"),
  optionA: text("option_a"),
  optionB: text("option_b"),
  optionC: text("option_c"),
  optionD: text("option_d"),
  correctOption: integer("correct_option"),
  explanation: text("explanation"),
});

export const testResultsTable = pgTable("test_results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  testId: integer("test_id").notNull().references(() => testsTable.id),
  totalQuestions: integer("total_questions").notNull(),
  attempted: integer("attempted").notNull(),
  correct: integer("correct").notNull(),
  incorrect: integer("incorrect").notNull(),
  score: integer("score").notNull(),
  mastery: integer("mastery").notNull(),
  answersJson: text("answers_json"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertTestSchema = createInsertSchema(testsTable).omit({ id: true });
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof testsTable.$inferSelect;

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({ id: true, completedAt: true });
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;
