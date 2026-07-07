import { Router, type IRouter } from "express";
import { db, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, generateToken, authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, classLevel } = parsed.data;

  const existing = await db.select().from(studentsTable).where(eq(studentsTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [student] = await db.insert(studentsTable).values({
    name,
    email,
    passwordHash,
    classLevel,
    points: 0,
  }).returning();

  const token = generateToken(student.id);

  res.status(201).json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      classLevel: student.classLevel,
      points: student.points,
      avatarUrl: student.avatarUrl ?? null,
      createdAt: student.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const passwordHash = hashPassword(password);

  const students = await db.select().from(studentsTable)
    .where(eq(studentsTable.email, email));

  if (students.length === 0 || students[0].passwordHash !== passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const student = students[0];
  const token = generateToken(student.id);

  res.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      classLevel: student.classLevel,
      points: student.points,
      avatarUrl: student.avatarUrl ?? null,
      createdAt: student.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", authMiddleware, (req, res): void => {
  const student = (req as any).student;
  res.json({
    id: student.id,
    name: student.name,
    email: student.email,
    classLevel: student.classLevel,
    points: student.points,
    avatarUrl: student.avatarUrl ?? null,
    createdAt: student.createdAt.toISOString(),
  });
});

export default router;
