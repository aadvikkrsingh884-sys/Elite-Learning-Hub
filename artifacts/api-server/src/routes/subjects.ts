import { Router, type IRouter } from "express";
import { db, subjectsTable, chaptersTable, topicsTable, progressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListSubjectsQueryParams, GetSubjectParams, ListChaptersParams, ListTopicsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function parseIntParam(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? undefined : n;
}

router.get("/subjects", async (req, res): Promise<void> => {
  const params = ListSubjectsQueryParams.safeParse(req.query);
  const classLevel = params.success ? params.data.classLevel : undefined;

  const subjects = classLevel
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.classLevel, classLevel))
    : await db.select().from(subjectsTable);

  const studentId = (req as any).student?.id;

  const result = await Promise.all(subjects.map(async (subj) => {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subj.id));
    let completedChapters = 0;
    let totalTopics = 0;
    let completedTopics = 0;

    for (const ch of chapters) {
      const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
      totalTopics += topics.length;

      if (studentId) {
        const doneTopics = await db.select().from(progressTable)
          .where(and(eq(progressTable.studentId, studentId), eq(progressTable.chapterId, ch.id), eq(progressTable.status, "complete")));
        completedTopics += doneTopics.length;
        if (doneTopics.length === topics.length && topics.length > 0) completedChapters++;
      }
    }

    return {
      id: subj.id,
      name: subj.name,
      classLevel: subj.classLevel,
      icon: subj.icon,
      color: subj.color,
      totalChapters: chapters.length,
      completedChapters,
      totalTopics,
      completedTopics,
    };
  }));

  res.json(result);
});

router.get("/subjects/:subjectId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId;
  const subjectId = parseInt(raw, 10);

  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
  if (subjects.length === 0) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const subj = subjects[0];
  const studentId = (req as any).student?.id;

  const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subjectId));

  const chaptersWithTopics = await Promise.all(chapters.map(async (ch) => {
    const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
    let chapterStatus: string = "not_started";
    let mastery = 0;

    if (studentId) {
      const progressRows = await db.select().from(progressTable)
        .where(and(eq(progressTable.studentId, studentId), eq(progressTable.chapterId, ch.id)));
      const completeCount = progressRows.filter(p => p.status === "complete").length;
      if (completeCount === topics.length && topics.length > 0) {
        chapterStatus = "complete";
        mastery = 100;
      } else if (completeCount > 0) {
        chapterStatus = "in_progress";
        mastery = topics.length > 0 ? Math.round((completeCount / topics.length) * 100) : 0;
      } else {
        const hasReview = progressRows.find(p => p.status === "needs_review");
        chapterStatus = hasReview ? "marked_for_review" : "not_started";
        mastery = 0;
      }
    }

    return {
      id: ch.id,
      subjectId: ch.subjectId,
      number: ch.number,
      title: ch.title,
      status: chapterStatus,
      mastery,
      topics: topics.map(t => ({
        id: t.id,
        chapterId: t.chapterId,
        title: t.title,
        status: "not_started",
        isImportant: t.isImportant === 1,
      })),
    };
  }));

  const allTopics = chaptersWithTopics.flatMap(c => c.topics);
  const completedTopics = studentId
    ? (await db.select().from(progressTable)
        .where(and(eq(progressTable.studentId, studentId), eq(progressTable.subjectId, subjectId), eq(progressTable.status, "complete")))).length
    : 0;
  const mastery = allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

  res.json({
    id: subj.id,
    name: subj.name,
    classLevel: subj.classLevel,
    icon: subj.icon,
    color: subj.color,
    mastery,
    weeklyGoal: 5,
    weeklyCompleted: Math.min(completedTopics, 5),
    chapters: chaptersWithTopics,
  });
});

router.get("/subjects/:subjectId/chapters", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.subjectId) ? req.params.subjectId[0] : req.params.subjectId;
  const subjectId = parseInt(raw, 10);

  const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subjectId));

  const result = await Promise.all(chapters.map(async (ch) => {
    const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
    return {
      id: ch.id,
      subjectId: ch.subjectId,
      number: ch.number,
      title: ch.title,
      status: "not_started",
      mastery: 0,
      topics: topics.map(t => ({
        id: t.id,
        chapterId: t.chapterId,
        title: t.title,
        status: "not_started",
        isImportant: t.isImportant === 1,
      })),
    };
  }));

  res.json(result);
});

router.get("/topics", async (req, res): Promise<void> => {
  const chapterId = parseIntParam(req.query.chapterId);

  const topics = chapterId
    ? await db.select().from(topicsTable).where(eq(topicsTable.chapterId, chapterId))
    : await db.select().from(topicsTable);

  res.json(topics.map(t => ({
    id: t.id,
    chapterId: t.chapterId,
    title: t.title,
    status: "not_started",
    isImportant: t.isImportant === 1,
  })));
});

export default router;
