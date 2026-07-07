import { Router, type IRouter } from "express";
import { db, testsTable, questionsTable, testResultsTable, subjectsTable, studentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListTestsQueryParams, SubmitTestBody } from "@workspace/api-zod";

const router: IRouter = Router();

function parseIntParam(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? undefined : n;
}

router.get("/tests", async (req, res): Promise<void> => {
  const params = ListTestsQueryParams.safeParse(req.query);
  let tests = await db.select().from(testsTable);

  if (params.success) {
    if (params.data.classLevel) {
      tests = tests.filter(t => t.classLevel === params.data.classLevel);
    }
    if (params.data.subjectId) {
      tests = tests.filter(t => t.subjectId === params.data.subjectId);
    }
  }

  const subjects = await db.select().from(subjectsTable);
  const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name]));

  res.json(tests.map(t => ({
    id: t.id,
    title: t.title,
    subjectId: t.subjectId,
    subjectName: subjectMap[t.subjectId] ?? "Unknown",
    classLevel: t.classLevel,
    totalQuestions: t.totalQuestions,
    duration: t.duration,
    difficulty: t.difficulty,
    level: t.level,
    chapterName: t.chapterName ?? null,
  })));
});

router.get("/tests/:testId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.testId) ? req.params.testId[0] : req.params.testId;
  const testId = parseInt(raw, 10);

  const tests = await db.select().from(testsTable).where(eq(testsTable.id, testId));
  if (tests.length === 0) {
    res.status(404).json({ error: "Test not found" });
    return;
  }

  const test = tests[0];
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.testId, testId));
  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.id, test.subjectId));
  const subjectName = subjects[0]?.name ?? "Unknown";

  res.json({
    id: test.id,
    title: test.title,
    subjectId: test.subjectId,
    subjectName,
    classLevel: test.classLevel,
    totalQuestions: test.totalQuestions,
    duration: test.duration,
    difficulty: test.difficulty,
    level: test.level,
    chapterName: test.chapterName ?? null,
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean) as string[],
      correctOption: q.correctOption ?? null,
      explanation: q.explanation ?? null,
    })),
  });
});

router.post("/tests/:testId/submit", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.testId) ? req.params.testId[0] : req.params.testId;
  const testId = parseInt(raw, 10);

  const parsed = SubmitTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tests = await db.select().from(testsTable).where(eq(testsTable.id, testId));
  if (tests.length === 0) {
    res.status(404).json({ error: "Test not found" });
    return;
  }

  const test = tests[0];
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.testId, testId));
  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.id, test.subjectId));
  const subjectName = subjects[0]?.name ?? "Unknown";

  const { answers } = parsed.data;
  let correct = 0;
  const wrongAnswers: Array<{ questionId: number; questionText: string; yourAnswer: string; correctAnswer: string }> = [];

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) continue;

    if (question.type === "multiple_choice" && question.correctOption !== null) {
      const options = [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean);
      if (answer.selectedOption === question.correctOption) {
        correct++;
      } else {
        wrongAnswers.push({
          questionId: question.id,
          questionText: question.text,
          yourAnswer: answer.selectedOption !== null && answer.selectedOption !== undefined
            ? (options[answer.selectedOption] ?? "No answer")
            : "No answer",
          correctAnswer: options[question.correctOption] ?? "Unknown",
        });
      }
    }
  }

  const attempted = answers.filter(a => a.selectedOption !== null && a.selectedOption !== undefined).length;
  const incorrect = attempted - correct;
  const score = test.totalQuestions > 0 ? Math.round((correct / test.totalQuestions) * 100) : 0;
  const mastery = score;

  const student = (req as any).student;
  const studentId = student?.id ?? 0;

  let resultId = 0;
  if (studentId > 0) {
    const [inserted] = await db.insert(testResultsTable).values({
      studentId,
      testId,
      totalQuestions: test.totalQuestions,
      attempted,
      correct,
      incorrect,
      score,
      mastery,
      answersJson: JSON.stringify(answers),
    }).returning();
    resultId = inserted.id;

    // Award points
    await db.update(studentsTable)
      .set({ points: correct * 10 })
      .where(eq(studentsTable.id, studentId));
  }

  res.json({
    id: resultId,
    testId: test.id,
    testTitle: test.title,
    subjectName,
    classLevel: test.classLevel,
    totalQuestions: test.totalQuestions,
    attempted,
    correct,
    incorrect,
    score,
    mastery,
    completedAt: new Date().toISOString(),
    wrongAnswers,
    topicBreakdown: [
      { topic: "Core Concepts", score: Math.min(100, score + 5) },
      { topic: "Application", score: Math.max(0, score - 10) },
      { topic: "Problem Solving", score: score },
    ],
  });
});

export default router;
