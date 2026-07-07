import { Router, type IRouter } from "express";
import { db, bookmarksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { AddBookmarkBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookmarks", authMiddleware, async (req, res): Promise<void> => {
  const student = (req as any).student;
  const bookmarks = await db.select().from(bookmarksTable)
    .where(eq(bookmarksTable.studentId, student.id));

  res.json(bookmarks.map(b => ({
    id: b.id,
    type: b.type,
    referenceId: b.referenceId,
    title: b.title,
    subject: b.subject,
    chapter: b.chapter,
    createdAt: b.createdAt.toISOString(),
  })));
});

router.post("/bookmarks", authMiddleware, async (req, res): Promise<void> => {
  const parsed = AddBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const student = (req as any).student;
  const { type, referenceId, title, subject, chapter } = parsed.data;

  const [bookmark] = await db.insert(bookmarksTable).values({
    studentId: student.id,
    type,
    referenceId,
    title,
    subject,
    chapter,
  }).returning();

  res.status(201).json({
    id: bookmark.id,
    type: bookmark.type,
    referenceId: bookmark.referenceId,
    title: bookmark.title,
    subject: bookmark.subject,
    chapter: bookmark.chapter,
    createdAt: bookmark.createdAt.toISOString(),
  });
});

router.delete("/bookmarks/:bookmarkId", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.bookmarkId) ? req.params.bookmarkId[0] : req.params.bookmarkId;
  const bookmarkId = parseInt(raw, 10);
  const student = (req as any).student;

  await db.delete(bookmarksTable)
    .where(and(eq(bookmarksTable.id, bookmarkId), eq(bookmarksTable.studentId, student.id)));

  res.status(204).send();
});

export default router;
