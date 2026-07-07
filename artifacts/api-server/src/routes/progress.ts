import { Router, type IRouter } from "express";
import { db, progressTable, topicsTable, chaptersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { UpdateTopicProgressBody } from "@workspace/api-zod";

const router: IRouter = Router();

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
