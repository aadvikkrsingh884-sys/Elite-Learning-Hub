import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),          // nullable — Google-only users have no password
  googleId: text("google_id").unique(),          // Google OAuth sub
  classLevel: integer("class_level").notNull().default(9),
  points: integer("points").notNull().default(0),
  avatarUrl: text("avatar_url"),
  resetToken: text("reset_token"),               // password reset token (hashed)
  resetTokenExpiry: timestamp("reset_token_expiry"), // token expiry
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
