import { createHmac, randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET ?? "aura_learning_secret_2026";

export function hashPassword(password: string): string {
  const salt = "aura_learning_salt_2026";
  return createHmac("sha256", SECRET).update(password + salt).digest("hex");
}

export function generateToken(studentId: number): string {
  const random = randomBytes(32).toString("hex");
  const payload = `${studentId}:${random}:${Date.now()}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function parseToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 4) return null;
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(":");
    const expectedSig = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    const id = parseInt(parts[0], 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const studentId = parseToken(token);
  if (!studentId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const students = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (students.length === 0) {
    res.status(401).json({ error: "Student not found" });
    return;
  }

  (req as any).student = students[0];
  next();
}
