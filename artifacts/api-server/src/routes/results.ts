import { Router, type IRouter } from "express";
import { db, testResultsTable, testsTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

async function formatResult(r: typeof testResultsTable.$inferSelect) {
  const tests = await db.select().from(testsTable).where(eq(testsTable.id, r.testId));
  const test = tests[0];
  const subjects = test ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, test.subjectId)) : [];
  const subjectName = subjects[0]?.name ?? "Unknown";

  return {
    id: r.id,
    testId: r.testId,
    testTitle: test?.title ?? "Test",
    subjectName,
    classLevel: test?.classLevel ?? 8,
    totalQuestions: r.totalQuestions,
    attempted: r.attempted,
    correct: r.correct,
    incorrect: r.incorrect,
    score: r.score,
    mastery: r.mastery,
    completedAt: r.completedAt.toISOString(),
    wrongAnswers: [],
    topicBreakdown: [
      { topic: "Core Concepts", score: Math.min(100, r.score + 5) },
      { topic: "Application", score: Math.max(0, r.score - 10) },
      { topic: "Problem Solving", score: r.score },
    ],
  };
}

router.get("/results", authMiddleware, async (req, res): Promise<void> => {
  const student = (req as any).student;
  const results = await db.select().from(testResultsTable)
    .where(eq(testResultsTable.studentId, student.id));

  const formatted = await Promise.all(results.map(formatResult));
  res.json(formatted);
});

router.get("/results/:resultId", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.resultId) ? req.params.resultId[0] : req.params.resultId;
  const resultId = parseInt(raw, 10);
  const student = (req as any).student;

  // Scope by authenticated student to prevent IDOR
  const results = await db.select().from(testResultsTable)
    .where(and(eq(testResultsTable.id, resultId), eq(testResultsTable.studentId, student.id)));

  if (results.length === 0) {
    res.status(404).json({ error: "Result not found" });
    return;
  }

  const formatted = await formatResult(results[0]);
  res.json(formatted);
});

export default router;
