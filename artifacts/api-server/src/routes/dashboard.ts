import { Router, type IRouter } from "express";
import { db, studentsTable, testResultsTable, testsTable, subjectsTable, chaptersTable, topicsTable, progressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    authMiddleware(req, res, next);
  } else {
    next();
  }
}

router.get("/dashboard/summary", optionalAuth, async (req, res): Promise<void> => {
  const student = (req as any).student;

  // If no auth, return guest data
  if (!student) {
    const chapters = await db.select().from(chaptersTable).limit(1);
    const topics = chapters.length > 0
      ? await db.select().from(topicsTable).where(eq(topicsTable.chapterId, chapters[0].id))
      : [];

    res.json({
      student: {
        id: 0,
        name: "Guest",
        email: "",
        classLevel: 8,
        points: 0,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      totalPoints: 0,
      weeklyGoalCompleted: 0,
      weeklyGoalTotal: 5,
      overallMastery: 0,
      totalTestsTaken: 0,
      averageScore: 0,
      currentChapter: chapters.length > 0 ? {
        id: chapters[0].id,
        subjectId: chapters[0].subjectId,
        number: chapters[0].number,
        title: chapters[0].title,
        status: "not_started",
        mastery: 0,
        topics: topics.map(t => ({
          id: t.id,
          chapterId: t.chapterId,
          title: t.title,
          status: "not_started",
          isImportant: t.isImportant === 1,
        })),
      } : null,
      streakDays: 0,
    });
    return;
  }

  const results = await db.select().from(testResultsTable).where(eq(testResultsTable.studentId, student.id));
  const totalTestsTaken = results.length;
  const averageScore = totalTestsTaken > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalTestsTaken)
    : 0;

  const progressRows = await db.select().from(progressTable).where(eq(progressTable.studentId, student.id));
  const completedThisWeek = progressRows.filter(p => {
    const updatedAt = new Date(p.updatedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return updatedAt > weekAgo && p.status === "complete";
  }).length;

  const allSubjects = await db.select().from(subjectsTable).where(eq(subjectsTable.classLevel, student.classLevel));
  let totalTopics = 0;
  let completedTopics = 0;
  for (const subj of allSubjects) {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subj.id));
    for (const ch of chapters) {
      const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
      totalTopics += topics.length;
    }
    const done = progressRows.filter(p => p.subjectId === subj.id && p.status === "complete").length;
    completedTopics += done;
  }
  const overallMastery = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Find current chapter (first in-progress or first not started)
  const inProgressProgress = progressRows.filter(p => p.status === "in_progress");
  let currentChapterId = inProgressProgress[0]?.chapterId;

  if (!currentChapterId) {
    const firstChapter = await db.select().from(chaptersTable)
      .where(eq(chaptersTable.subjectId, allSubjects[0]?.id ?? 0))
      .limit(1);
    currentChapterId = firstChapter[0]?.id;
  }

  let currentChapter = null;
  if (currentChapterId) {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.id, currentChapterId));
    if (chapters.length > 0) {
      const ch = chapters[0];
      const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
      currentChapter = {
        id: ch.id,
        subjectId: ch.subjectId,
        number: ch.number,
        title: ch.title,
        status: "in_progress",
        mastery: 60,
        topics: topics.map(t => ({
          id: t.id,
          chapterId: t.chapterId,
          title: t.title,
          status: "not_started",
          isImportant: t.isImportant === 1,
        })),
      };
    }
  }

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
    totalPoints: student.points,
    weeklyGoalCompleted: Math.min(completedThisWeek, 5),
    weeklyGoalTotal: 5,
    overallMastery,
    totalTestsTaken,
    averageScore,
    currentChapter,
    streakDays: Math.min(7, totalTestsTaken + completedThisWeek),
  });
});

router.get("/dashboard/recent-tests", optionalAuth, async (req, res): Promise<void> => {
  const student = (req as any).student;
  if (!student) {
    res.json([]);
    return;
  }

  const results = await db.select().from(testResultsTable)
    .where(eq(testResultsTable.studentId, student.id));

  const recent = results.slice(-5).reverse();
  const formatted = await Promise.all(recent.map(async r => {
    const tests = await db.select().from(testsTable).where(eq(testsTable.id, r.testId));
    const test = tests[0];
    const subjects = test ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, test.subjectId)) : [];
    return {
      id: r.id,
      testId: r.testId,
      testTitle: test?.title ?? "Test",
      subjectName: subjects[0]?.name ?? "Unknown",
      classLevel: test?.classLevel ?? 8,
      totalQuestions: r.totalQuestions,
      attempted: r.attempted,
      correct: r.correct,
      incorrect: r.incorrect,
      score: r.score,
      mastery: r.mastery,
      completedAt: r.completedAt.toISOString(),
      wrongAnswers: [],
      topicBreakdown: [],
    };
  }));

  res.json(formatted);
});

router.get("/dashboard/subject-progress", optionalAuth, async (req, res): Promise<void> => {
  const student = (req as any).student;
  const classLevel = student?.classLevel ?? 8;

  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.classLevel, classLevel));

  const result = await Promise.all(subjects.map(async (subj) => {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.subjectId, subj.id));
    let totalTopics = 0;
    for (const ch of chapters) {
      const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, ch.id));
      totalTopics += topics.length;
    }

    let completedTopics = 0;
    if (student?.id) {
      const done = await db.select().from(progressTable)
        .where(and(eq(progressTable.studentId, student.id), eq(progressTable.subjectId, subj.id), eq(progressTable.status, "complete")));
      completedTopics = done.length;
    }

    const mastery = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      subjectId: subj.id,
      subjectName: subj.name,
      color: subj.color,
      icon: subj.icon,
      completedTopics,
      totalTopics,
      mastery,
    };
  }));

  res.json(result);
});

export default router;
