import { Router, type IRouter } from "express";
import { db, progressTable, topicsTable, chaptersTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { UpdateTopicProgressBody } from "@workspace/api-zod";

// optionalAuth: if a valid Bearer token is present, authenticate; if the token
// is absent OR invalid/expired, silently continue as guest (no 401 issued).
function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Wrap authMiddleware so that auth failures degrade to guest rather than 401.
    authMiddleware(req, res, (err?: any) => {
      if (err) {
        // Auth failed — treat as unauthenticated guest.
        (req as any).student = undefined;
      }
      next();
    });
  } else {
    next();
  }
}

const router: IRouter = Router();

// ── GET /progress/report ─────────────────────────────────────────────────────
// Returns a full subject → chapter → topic tree with per-topic status for the
// authenticated student (or all "not_started" for unauthenticated guests).
// Accepts optional ?classLevel=N query param (defaults to student's class).
router.get("/progress/report", optionalAuth, async (req, res): Promise<void> => {
  const student = (req as any).student;
  const rawLevel = req.query.classLevel ? parseInt(String(req.query.classLevel), 10) : NaN;
  const classLevelParam = Number.isFinite(rawLevel) && rawLevel >= 1 && rawLevel <= 12
    ? rawLevel
    : undefined;
  const classLevel = classLevelParam ?? student?.classLevel ?? 9;

  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.classLevel, classLevel));

  const progressRows = student
    ? await db.select().from(progressTable).where(eq(progressTable.studentId, student.id))
    : [];

  const progressMap = new Map<number, string>();
  for (const p of progressRows) {
    if (p.topicId != null) progressMap.set(p.topicId, p.status);
  }

  const report = await Promise.all(subjects.map(async (subj) => {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subj.id));

    const chaptersData = await Promise.all(chapters.map(async (ch) => {
      const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
      const topicsData = topics.map(t => ({
        id: t.id,
        title: t.title,
        isImportant: t.isImportant === 1,
        status: progressMap.get(t.id) ?? "not_started",
      }));

      const completedCount = topicsData.filter(t => t.status === "complete").length;
      const masteryPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

      return {
        id: ch.id,
        number: ch.number,
        title: ch.title,
        topics: topicsData,
        completedTopics: completedCount,
        totalTopics: topics.length,
        mastery: masteryPct,
      };
    }));

    const totalTopics = chaptersData.reduce((s, c) => s + c.totalTopics, 0);
    const completedTopics = chaptersData.reduce((s, c) => s + c.completedTopics, 0);

    return {
      id: subj.id,
      name: subj.name,
      color: subj.color,
      icon: subj.icon,
      totalChapters: chapters.length,
      totalTopics,
      completedTopics,
      mastery: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      chapters: chaptersData,
    };
  }));

  res.json({
    student: student
      ? { id: student.id, name: student.name, email: student.email, classLevel: student.classLevel }
      : { id: 0, name: "Guest", email: "", classLevel },
    classLevel,
    generatedAt: new Date().toISOString(),
    subjects: report,
  });
});

// ── GET /progress ─────────────────────────────────────────────────────────────
router.get("/progress", authMiddleware, async (req, res): Promise<void> => {
  const student = (req as any).student;
  const rows = await db.select().from(progressTable).where(eq(progressTable.studentId, student.id));
  res.json(rows.map(r => ({
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    chapterId: r.chapterId,
    topicId: r.topicId ?? null,
    status: r.status,
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.post("/progress/topic", authMiddleware, async (req, res): Promise<void> => {
  const parsed = UpdateTopicProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const student = (req as any).student;
  const { topicId, status } = parsed.data;

  const topics = await db.select().from(topicsTable).where(eq(topicsTable.id, topicId));
  if (topics.length === 0) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  const topic = topics[0];
  const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.id, topic.chapterId));
  if (chapters.length === 0) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }

  const chapter = chapters[0];

  const existing = await db.select().from(progressTable)
    .where(and(eq(progressTable.studentId, student.id), eq(progressTable.topicId, topicId)));

  let result;
  if (existing.length > 0) {
    const updated = await db.update(progressTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(progressTable.id, existing[0].id))
      .returning();
    result = updated[0];
  } else {
    const inserted = await db.insert(progressTable).values({
      studentId: student.id,
      subjectId: chapter.subjectId,
      chapterId: chapter.id,
      topicId: topicId,
      status,
    }).returning();
    result = inserted[0];
  }

  res.json({
    id: result.id,
    studentId: result.studentId,
    subjectId: result.subjectId,
    chapterId: result.chapterId,
    topicId: result.topicId ?? null,
    status: result.status,
    updatedAt: result.updatedAt.toISOString(),
  });
});

export default router;
