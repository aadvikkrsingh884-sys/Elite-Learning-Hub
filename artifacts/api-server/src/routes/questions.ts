import { Router, type IRouter } from "express";
import { db, importantQuestionsTable, bookmarksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListImportantQuestionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function parseIntParam(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? undefined : n;
}

router.get("/questions/important", async (req, res): Promise<void> => {
  const params = ListImportantQuestionsQueryParams.safeParse(req.query);
  let qs = await db.select().from(importantQuestionsTable);

  if (params.success) {
    if (params.data.classLevel) {
      qs = qs.filter(q => q.classLevel === params.data.classLevel);
    }
    if (params.data.subject) {
      const subj = params.data.subject.toLowerCase();
      qs = qs.filter(q => q.subject.toLowerCase().includes(subj));
    }
  }

  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const total = qs.length;
  const paged = qs.slice((page - 1) * limit, page * limit);

  const studentId = (req as any).student?.id;
  let bookmarkSet = new Set<number>();
  if (studentId) {
    const bookmarks = await db.select().from(bookmarksTable)
      .where(and(eq(bookmarksTable.studentId, studentId), eq(bookmarksTable.type, "question")));
    bookmarkSet = new Set(bookmarks.map(b => b.referenceId));
  }

  res.json({
    questions: paged.map(q => ({
      id: q.id,
      text: q.text,
      subject: q.subject,
      chapter: q.chapter,
      difficulty: q.difficulty,
      frequency: q.frequency,
      solution: q.solution,
      tags: JSON.parse(q.tags || "[]"),
      year: q.year ?? null,
      isBookmarked: bookmarkSet.has(q.id),
    })),
    total,
    page,
    limit,
  });
});

export default router;
