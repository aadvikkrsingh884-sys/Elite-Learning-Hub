import { Router, type IRouter } from "express";
import { db, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, generateToken, authMiddleware } from "../lib/auth";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import { createHash, randomBytes } from "crypto";

const router: IRouter = Router();

// ─── Google OAuth client ─────────────────────────────────────────────────────
const googleClient = process.env["GOOGLE_CLIENT_ID"]
  ? new OAuth2Client(process.env["GOOGLE_CLIENT_ID"])
  : null;

// ─── Resend email client ─────────────────────────────────────────────────────
const resend = process.env["RESEND_API_KEY"]
  ? new Resend(process.env["RESEND_API_KEY"])
  : null;

const FROM_EMAIL = process.env["RESEND_FROM_EMAIL"] ?? "AuraLearning <onboarding@resend.dev>";

// ─── Register ────────────────────────────────────────────────────────────────
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

// ─── Login ───────────────────────────────────────────────────────────────────
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

  if (students.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const student = students[0];

  // Google-only account — no password set
  if (!student.passwordHash) {
    res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google button to log in." });
    return;
  }

  if (student.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

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

// ─── Google OAuth — verify ID token, find-or-create student ─────────────────
router.post("/auth/google", async (req, res): Promise<void> => {
  if (!googleClient) {
    res.status(503).json({ error: "Google Sign-In is not configured on this server." });
    return;
  }

  const { credential } = req.body as { credential?: string };
  if (!credential || typeof credential !== "string") {
    res.status(400).json({ error: "Google credential token is required." });
    return;
  }

  let payload: Awaited<ReturnType<typeof googleClient.verifyIdToken>>["getPayload"] extends () => infer R ? R : never;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env["GOOGLE_CLIENT_ID"]!,
    });
    const p = ticket.getPayload();
    if (!p || !p.sub || !p.email) {
      res.status(401).json({ error: "Invalid Google token." });
      return;
    }
    payload = p;
  } catch {
    res.status(401).json({ error: "Could not verify Google credentials." });
    return;
  }

  const googleId   = payload!.sub!;
  const email      = payload!.email!;
  const name       = payload!.name  ?? email.split("@")[0];
  const avatarUrl  = payload!.picture ?? null;

  // 1. Find by googleId
  let students = await db.select().from(studentsTable).where(eq(studentsTable.googleId, googleId));

  // 2. Link existing email account if not yet linked
  if (students.length === 0) {
    const byEmail = await db.select().from(studentsTable).where(eq(studentsTable.email, email));
    if (byEmail.length > 0) {
      await db.update(studentsTable)
        .set({ googleId, avatarUrl: byEmail[0].avatarUrl ?? avatarUrl })
        .where(eq(studentsTable.id, byEmail[0].id));
      students = await db.select().from(studentsTable).where(eq(studentsTable.id, byEmail[0].id));
    }
  }

  // 3. Create new account
  if (students.length === 0) {
    const [created] = await db.insert(studentsTable).values({
      name,
      email,
      googleId,
      avatarUrl,
      classLevel: 9,
      points: 0,
    }).returning();
    students = [created];
  }

  const student = students[0];
  // Keep avatar fresh
  if (avatarUrl && student.avatarUrl !== avatarUrl) {
    await db.update(studentsTable).set({ avatarUrl }).where(eq(studentsTable.id, student.id));
  }

  const token = generateToken(student.id);
  res.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      classLevel: student.classLevel,
      points: student.points,
      avatarUrl: avatarUrl ?? student.avatarUrl ?? null,
      createdAt: student.createdAt.toISOString(),
    },
    token,
  });
});

// ─── Forgot Password — send reset email ─────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  // Always respond 200 to prevent email enumeration
  res.json({ success: true, message: "If that email exists, a reset link has been sent." });

  // Run the rest async (fire-and-forget after response)
  try {
    const students = await db.select().from(studentsTable).where(eq(studentsTable.email, email.toLowerCase().trim()));
    if (students.length === 0) return;

    const student = students[0];

    // Generate a secure random token, store its SHA-256 hash
    const rawToken    = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expiry      = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(studentsTable)
      .set({ resetToken: hashedToken, resetTokenExpiry: expiry })
      .where(eq(studentsTable.id, student.id));

    if (!resend) return;

    const resetUrl = `${req.headers.origin ?? "https://auralearning.app"}/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your AuraLearning password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="color:#4f46e5">AuraLearning Elite</h2>
          <p>Hi ${student.name},</p>
          <p>We received a request to reset your password. Click the button below — this link is valid for <strong>1 hour</strong>.</p>
          <p style="margin:28px 0">
            <a href="${resetUrl}"
               style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Reset Password
            </a>
          </p>
          <p style="color:#888;font-size:13px">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:12px">AuraLearning Elite — CBSE Study Companion</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[forgot-password] error:", err);
  }
});

// ─── Reset Password — validate token, set new password ──────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Reset token is required." });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");
  const students = await db.select().from(studentsTable)
    .where(eq(studentsTable.resetToken, hashedToken));

  if (students.length === 0) {
    res.status(400).json({ error: "Invalid or expired reset link." });
    return;
  }

  const student = students[0];
  if (!student.resetTokenExpiry || student.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "This reset link has expired. Please request a new one." });
    return;
  }

  const newHash = hashPassword(password);
  await db.update(studentsTable)
    .set({ passwordHash: newHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(studentsTable.id, student.id));

  res.json({ success: true, message: "Password updated. You can now log in." });
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

// ─── Me ──────────────────────────────────────────────────────────────────────
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
