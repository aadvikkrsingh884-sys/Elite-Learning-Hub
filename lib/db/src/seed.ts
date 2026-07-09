import { createHmac } from "crypto";
import { sql } from "drizzle-orm";
import { db, pool, subjectsTable, chaptersTable, topicsTable, testsTable, questionsTable, importantQuestionsTable, studentsTable, bookmarksTable, progressTable, testResultsTable, questionBankTable, flashcardsTable, studyResourcesTable } from "./index";
import { CURRICULUM, GRAMMAR_SUBJECTS } from "./curriculum";
import { generateTopics, generateQuestionBank, generateFlashcards } from "./question-generators";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set before seeding (it salts the demo student's password hash).");
}
const SECRET = process.env.SESSION_SECRET;
function hashPassword(password: string): string {
  const salt = "aura_learning_salt_2026";
  return createHmac("sha256", SECRET).update(password + salt).digest("hex");
}

const SUBJECT_META: Record<string, { icon: string; color: string }> = {
  Mathematics: { icon: "calculator", color: "#2563eb" },
  Science: { icon: "flask-conical", color: "#16a34a" },
  "Social Science": { icon: "globe", color: "#d97706" },
  English: { icon: "book-open", color: "#dc2626" },
  Hindi: { icon: "languages", color: "#7c3aed" },
  "English Grammar": { icon: "spell-check", color: "#0891b2" },
  "Hindi Grammar": { icon: "spell-check", color: "#be185d" },
};

const CLASS_LEVELS = [6, 7, 8, 9, 10];
const CORE_SUBJECT_NAMES = Object.keys(CURRICULUM);
const TOPICS_PER_CHAPTER = 20;
const QUESTIONS_PER_CHAPTER = 20;
const FLASHCARDS_PER_CHAPTER = 8;

// Batch-insert helper: drizzle-orm/pg can choke on very large single INSERT
// statements, so chunk large arrays before calling .values().
async function batchInsert<T>(table: any, rows: T[], chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (chunk.length > 0) await db.insert(table).values(chunk);
  }
}

async function main() {
  console.log("Seeding AuraLearning database — full-depth 2026-27 curriculum + Question Bank Engine...");
  const startedAt = Date.now();

  const report = {
    subjects: 0, chapters: 0, topics: 0, questionBankItems: 0, flashcards: 0,
    tests: 0, questions: 0, importantQuestions: 0,
    byClass: {} as Record<number, { chapters: number; topics: number; questions: number; flashcards: number }>,
  };

  // Truncate in dependency order — no wrapping transaction (the massive batch
  // inserts that follow must NOT share a single long-lived transaction, since
  // our batchInsert helper uses the module-level db, not a tx-scoped one).
  await db.execute(sql`TRUNCATE TABLE
    ${bookmarksTable}, ${progressTable}, ${testResultsTable}, ${questionsTable},
    ${importantQuestionsTable}, ${testsTable}, ${studyResourcesTable}, ${flashcardsTable},
    ${questionBankTable}, ${topicsTable}, ${chaptersTable}, ${subjectsTable}, ${studentsTable}
    RESTART IDENTITY CASCADE`);

  {
    // 1. Subjects — 5 core subjects x classes 6-10, plus 2 global Grammar subjects (classLevel 0).
    const subjectIdByClassName = new Map<string, number>();
    for (const classLevel of CLASS_LEVELS) {
      for (const name of CORE_SUBJECT_NAMES) {
        const meta = SUBJECT_META[name];
        const [row] = await db.insert(subjectsTable).values({ name, classLevel, icon: meta.icon, color: meta.color }).returning();
        subjectIdByClassName.set(`${classLevel}:${name}`, row.id);
        report.subjects++;
      }
    }
    const grammarSubjectId = new Map<string, number>();
    for (const name of Object.keys(GRAMMAR_SUBJECTS)) {
      const meta = SUBJECT_META[name];
      const [row] = await db.insert(subjectsTable).values({ name, classLevel: 0, icon: meta.icon, color: meta.color }).returning();
      grammarSubjectId.set(name, row.id);
      report.subjects++;
    }
    console.log(`Inserted ${report.subjects} subjects`);

    // 2. Chapters, keyed by (classLevel, subjectName, title) to avoid collisions
    // across classes/subjects (e.g. "Acids, Bases and Salts" in both Class 7 & 10).
    const chapterRows: { key: string; classLevel: number; subjectName: string; chapterId: number; title: string; subjectId: number }[] = [];
    for (const classLevel of CLASS_LEVELS) {
      for (const name of CORE_SUBJECT_NAMES) {
        const subjectId = subjectIdByClassName.get(`${classLevel}:${name}`)!;
        const chapters = CURRICULUM[name]?.[classLevel] ?? [];
        for (let i = 0; i < chapters.length; i++) {
          const [row] = await db.insert(chaptersTable).values({
            subjectId, number: i + 1, title: chapters[i],
            description: `Chapter ${i + 1} of Class ${classLevel} ${name}`,
          }).returning();
          chapterRows.push({ key: `${classLevel}:${name}:${chapters[i]}`, classLevel, subjectName: name, chapterId: row.id, title: chapters[i], subjectId });
          report.chapters++;
        }
      }
    }
    for (const name of Object.keys(GRAMMAR_SUBJECTS)) {
      const subjectId = grammarSubjectId.get(name)!;
      const chapters = GRAMMAR_SUBJECTS[name];
      for (let i = 0; i < chapters.length; i++) {
        const [row] = await db.insert(chaptersTable).values({
          subjectId, number: i + 1, title: chapters[i], description: `Unit ${i + 1} of ${name}`,
        }).returning();
        chapterRows.push({ key: `0:${name}:${chapters[i]}`, classLevel: 0, subjectName: name, chapterId: row.id, title: chapters[i], subjectId });
        report.chapters++;
      }
    }
    console.log(`Inserted ${report.chapters} chapters`);

    // 3. Topics — 20 per chapter, subject-aware templates (deep sub-topic coverage).
    const topicRows: any[] = [];
    for (const ch of chapterRows) {
      const topics = generateTopics(ch.subjectName, ch.title).slice(0, TOPICS_PER_CHAPTER);
      for (const t of topics) topicRows.push({ chapterId: ch.chapterId, title: t.title, isImportant: t.isImportant });
      report.topics += topics.length;
      const cls = report.byClass[ch.classLevel] ??= { chapters: 0, topics: 0, questions: 0, flashcards: 0 };
      cls.chapters++; cls.topics += topics.length;
    }
    await batchInsert(topicsTable, topicRows);
    console.log(`Inserted ${report.topics} topics`);

    // 4. Question Bank — 20 practice questions per chapter (mixed MCQ/descriptive,
    // subject-and-category-aware, computed answers verified where numeric).
    const questionBankRows: any[] = [];
    for (const ch of chapterRows) {
      const qs = generateQuestionBank(ch.subjectName, ch.title, ch.chapterId, QUESTIONS_PER_CHAPTER);
      for (const q of qs) {
        questionBankRows.push({
          chapterId: ch.chapterId, text: q.text, type: q.type, difficulty: q.difficulty,
          optionA: q.optionA ?? null, optionB: q.optionB ?? null, optionC: q.optionC ?? null, optionD: q.optionD ?? null,
          correctOption: q.correctOption ?? null, explanation: q.explanation,
        });
      }
      report.questionBankItems += qs.length;
      report.byClass[ch.classLevel].questions += qs.length;
    }
    await batchInsert(questionBankTable, questionBankRows);
    console.log(`Inserted ${report.questionBankItems} question bank items`);

    // 5. Flashcards — 8 per chapter for rapid revision.
    const flashcardRows: any[] = [];
    for (const ch of chapterRows) {
      const cards = generateFlashcards(ch.subjectName, ch.title, FLASHCARDS_PER_CHAPTER);
      for (const c of cards) flashcardRows.push({ chapterId: ch.chapterId, front: c.front, back: c.back, difficulty: c.difficulty });
      report.flashcards += cards.length;
      report.byClass[ch.classLevel].flashcards += cards.length;
    }
    await batchInsert(flashcardsTable, flashcardRows);
    console.log(`Inserted ${report.flashcards} flashcards`);

    // 6. Study Resources — 6 downloadable PDF types per chapter (2310 rows).
    const SEED_RESOURCE_TYPES = [
      { type: "VIPNote",      titleSuffix: "VIP Teacher Notes" },
      { type: "CheatSheet",   titleSuffix: "Cheat Sheet" },
      { type: "PYQ",          titleSuffix: "Previous Year Questions" },
      { type: "RevisionNote", titleSuffix: "Quick Revision Notes" },
      { type: "TopperNote",   titleSuffix: "Topper's Notes" },
      { type: "SamplePaper",  titleSuffix: "Sample Examination Paper" },
    ] as const;

    const studyResourceRows: any[] = [];
    for (const ch of chapterRows) {
      const classId = ch.classLevel === 0 ? 6 : ch.classLevel; // grammar = class 6
      for (const { type, titleSuffix } of SEED_RESOURCE_TYPES) {
        studyResourceRows.push({
          title: `${ch.title} — ${titleSuffix}`,
          resourceType: type,
          classId,
          subjectId: ch.subjectId,
          chapterId: ch.chapterId,
          fileUrl: null,
          description: null,
        });
      }
    }
    await batchInsert(studyResourcesTable, studyResourceRows);
    const studyResourceCount = studyResourceRows.length;
    console.log(`Inserted ${studyResourceCount} study resources (${chapterRows.length} chapters × ${SEED_RESOURCE_TYPES.length} types)`);

    // 7. Tests across classes with difficulty levels, referencing real chapters
    const testDefs: { title: string; subject: string; classLevel: number; difficulty: string; chapterName?: string }[] = [
      { title: "Rational Numbers Test", subject: "Mathematics", classLevel: 8, difficulty: "medium", chapterName: "Rational Numbers" },
      { title: "Algebraic Expressions Test", subject: "Mathematics", classLevel: 8, difficulty: "medium", chapterName: "Algebraic Expressions and Identities" },
      { title: "Force and Pressure Test", subject: "Science", classLevel: 8, difficulty: "easy", chapterName: "Force and Pressure" },
      { title: "Cell Structure Test", subject: "Science", classLevel: 8, difficulty: "medium", chapterName: "Cell—Structure and Functions" },
      { title: "Resources Test", subject: "Social Science", classLevel: 8, difficulty: "easy", chapterName: "Resources" },
      { title: "Indian Constitution Test", subject: "Social Science", classLevel: 8, difficulty: "medium", chapterName: "The Indian Constitution" },
      { title: "Class 6 Mathematics Basics", subject: "Mathematics", classLevel: 6, difficulty: "easy", chapterName: "Knowing Our Numbers" },
      { title: "Class 6 Science Basics", subject: "Science", classLevel: 6, difficulty: "easy", chapterName: "Food: Where Does It Come From?" },
      { title: "Class 7 Mathematics Practice", subject: "Mathematics", classLevel: 7, difficulty: "medium", chapterName: "Rational Numbers" },
      { title: "Class 7 Science Practice", subject: "Science", classLevel: 7, difficulty: "medium", chapterName: "Acids, Bases and Salts" },
      { title: "Class 9 Mathematics Challenge", subject: "Mathematics", classLevel: 9, difficulty: "hard", chapterName: "The World of Numbers" },
      { title: "Class 9 Science Challenge", subject: "Science", classLevel: 9, difficulty: "hard", chapterName: "Force and Laws of Motion" },
      { title: "Class 10 Mathematics Board Prep", subject: "Mathematics", classLevel: 10, difficulty: "hard", chapterName: "Real Numbers" },
      { title: "Class 10 Science Board Prep", subject: "Science", classLevel: 10, difficulty: "hard", chapterName: "Chemical Reactions and Equations" },
    ];

    const testIdByTitle = new Map<string, number>();
    for (const t of testDefs) {
      const subjectId = subjectIdByClassName.get(`${t.classLevel}:${t.subject}`)!;
      const [row] = await db.insert(testsTable).values({
        title: t.title, subjectId, classLevel: t.classLevel,
        totalQuestions: 20, duration: 25, difficulty: t.difficulty, level: "starting",
        chapterName: t.chapterName ?? null,
      }).returning();
      testIdByTitle.set(t.title, row.id);
    }
    report.tests = testDefs.length;
    console.log(`Inserted ${report.tests} tests`);

    // 7. Questions for a handful of key tests
    function makeMCQs(prefix: string, count: number) {
      return Array.from({ length: count }, (_, i) => ({
        text: `${prefix} — sample question ${i + 1}`,
        type: "multiple_choice",
        optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D",
        correctOption: (i % 4) + 1,
        explanation: `Explanation for ${prefix} question ${i + 1}.`,
      }));
    }
    const questionSets: [string, ReturnType<typeof makeMCQs>][] = [
      ["Rational Numbers Test", makeMCQs("Rational Numbers", 20)],
      ["Algebraic Expressions Test", makeMCQs("Algebraic Expressions", 20)],
      ["Force and Pressure Test", makeMCQs("Force and Pressure", 5)],
    ];
    for (const [testTitle, qs] of questionSets) {
      const testId = testIdByTitle.get(testTitle)!;
      for (const q of qs) { await db.insert(questionsTable).values({ testId, ...q }); report.questions++; }
    }
    console.log(`Inserted ${report.questions} test questions`);

    // 8. Hand-authored, fact-checked Important Questions (unchanged from prior seed;
    // these remain the curated, expert-quality set — distinct from the templated
    // Question Bank above).
    const importantQs: { subject: string; chapter: string; classLevel: number; difficulty: string; text: string; solution: string; frequency?: string; year?: string }[] = [
      { subject: "Mathematics", chapter: "Rational Numbers", classLevel: 8, difficulty: "medium", text: "Prove that the sum of two rational numbers is always rational.", solution: "Let a/b and c/d be rational numbers. Their sum (ad+bc)/bd is a ratio of integers, hence rational.", frequency: "Very Common", year: "2025" },
      { subject: "Mathematics", chapter: "Algebraic Expressions and Identities", classLevel: 8, difficulty: "medium", text: "Expand (a+b)^3 using the standard identity.", solution: "(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3.", frequency: "Common Question" },
      { subject: "Mathematics", chapter: "Squares and Square Roots", classLevel: 8, difficulty: "easy", text: "Find the square root of 1024 by prime factorisation.", solution: "1024 = 2^10, so sqrt(1024) = 2^5 = 32." },
      { subject: "Science", chapter: "Force and Pressure", classLevel: 8, difficulty: "medium", text: "Explain why a sharp knife cuts better than a blunt one.", solution: "A sharp knife has a smaller area of contact, so for the same force the pressure exerted is higher." },
      { subject: "Science", chapter: "Cell—Structure and Functions", classLevel: 8, difficulty: "easy", text: "Differentiate between plant cells and animal cells.", solution: "Plant cells have a cell wall, chloroplasts, and a large vacuole; animal cells lack these." },
      { subject: "Science", chapter: "Sound", classLevel: 8, difficulty: "medium", text: "Why can we not hear the sound produced by a vibrating pendulum?", solution: "Its frequency is too low, below 20 Hz, which is outside the audible range for humans." },
      { subject: "Social Science", chapter: "Resources", classLevel: 8, difficulty: "easy", text: "Distinguish between renewable and non-renewable resources with examples.", solution: "Renewable resources (sunlight, wind) can be replenished naturally; non-renewable ones (coal, petroleum) cannot be replenished within a human lifetime." },
      { subject: "Social Science", chapter: "The Indian Constitution", classLevel: 8, difficulty: "medium", text: "Why is the Indian Constitution called a living document?", solution: "It can be amended to reflect changing needs of society through the Article 368 amendment procedure." },
      { subject: "English", chapter: "The Best Christmas Present in the World / Anticipation", classLevel: 8, difficulty: "easy", text: "What was the significance of the Christmas Truce of 1914?", solution: "It showed that even in war, humanity and compassion can bring enemy soldiers together peacefully." },
      { subject: "Mathematics", chapter: "The World of Numbers", classLevel: 9, difficulty: "hard", text: "Prove that root 2 is an irrational number.", solution: "Assume root 2 = p/q in lowest terms; deriving a contradiction shows p and q share a common factor, so root 2 cannot be rational." },
      { subject: "Science", chapter: "Force and Laws of Motion", classLevel: 9, difficulty: "medium", text: "State Newton's second law of motion and its mathematical form.", solution: "The rate of change of momentum of a body is proportional to the applied force; F = ma." },
      { subject: "Social Science", chapter: "Democracy", classLevel: 9, difficulty: "medium", text: "What are the key features that distinguish a democracy from other forms of government?", solution: "Regular free and fair elections, rule of law, protection of fundamental rights, and accountability of the government to the people." },
      { subject: "Mathematics", chapter: "Real Numbers", classLevel: 10, difficulty: "hard", text: "State and prove Euclid's Division Lemma.", solution: "For positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 <= r < b; proved using the well-ordering principle." },
      { subject: "Science", chapter: "Chemical Reactions and Equations", classLevel: 10, difficulty: "hard", text: "Balance the equation for the reaction between zinc and dilute sulphuric acid, and identify the type of reaction.", solution: "Zn + H2SO4 -> ZnSO4 + H2; this is a displacement reaction." },
      { subject: "Social Science", chapter: "Power Sharing", classLevel: 10, difficulty: "medium", text: "Explain the concept of power sharing among different organs of government with an example.", solution: "Horizontal power sharing distributes power among the legislature, executive, and judiciary so that no single organ can exercise unchecked power, e.g. the Indian judiciary can strike down laws passed by the legislature." },
      { subject: "English", chapter: "A Letter to God", classLevel: 10, difficulty: "easy", text: "What does the story 'A Letter to God' reveal about Lencho's character?", solution: "Lencho has complete and unwavering faith, though the story also gently critiques blind faith when he blames the post office employees rather than questioning his belief." },
      { subject: "Mathematics", chapter: "Understanding Quadrilaterals", classLevel: 8, difficulty: "medium", text: "Find the sum of interior angles of a hexagon.", solution: "Sum = (n-2) x 180 = (6-2) x 180 = 720 degrees." },
      { subject: "Science", chapter: "Friction", classLevel: 8, difficulty: "easy", text: "Why is friction called a necessary evil?", solution: "It causes wear and tear and wastes energy, but without it we could not walk, write, or hold objects." },
      { subject: "Social Science", chapter: "Agriculture", classLevel: 8, difficulty: "medium", text: "What is meant by the 'Green Revolution' in India?", solution: "A period of major agricultural growth through high-yield seeds, irrigation, and fertilizers starting in the 1960s." },
      { subject: "Mathematics", chapter: "Mensuration", classLevel: 8, difficulty: "medium", text: "Derive the formula for the surface area of a cylinder.", solution: "Total surface area = 2*pi*r*(r + h), combining the curved surface area and the two circular ends." },
      { subject: "Science", chapter: "Combustion and Flame", classLevel: 8, difficulty: "easy", text: "What are the three essential conditions for combustion?", solution: "Presence of a combustible substance, supporter of combustion (usually oxygen), and ignition temperature." },
      { subject: "Social Science", chapter: "Industries", classLevel: 8, difficulty: "medium", text: "Classify industries on the basis of raw material used.", solution: "Agro-based, mineral-based, marine-based, and forest-based industries." },
      { subject: "Mathematics", chapter: "Exponents and Powers", classLevel: 8, difficulty: "easy", text: "Express 0.0000000000000942 in standard form.", solution: "9.42 x 10^-14." },
    ];

    for (const q of importantQs) {
      await db.insert(importantQuestionsTable).values({
        text: q.text, subject: q.subject, chapter: q.chapter, classLevel: q.classLevel,
        difficulty: q.difficulty, frequency: q.frequency ?? "Common Question",
        solution: q.solution, tags: "[]", year: q.year ?? null,
      });
    }
    report.importantQuestions = importantQs.length;
    console.log(`Inserted ${report.importantQuestions} important questions`);

    // 9. Demo student
    await db.insert(studentsTable).values({
      name: "Demo Student", email: "demo@auralearning.com", passwordHash: hashPassword("password123"),
      classLevel: 8, points: 2450, avatarUrl: null,
    });
    console.log("Inserted demo student (demo@auralearning.com / password123)");
  } // end seeding block

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log("\n================ SEED REPORT ================");
  console.log(`Subjects:           ${report.subjects}`);
  console.log(`Chapters:           ${report.chapters}`);
  console.log(`Topics:             ${report.topics}`);
  console.log(`Question Bank rows: ${report.questionBankItems}`);
  console.log(`Flashcards:         ${report.flashcards}`);
  console.log(`Tests:              ${report.tests}`);
  console.log(`Test questions:     ${report.questions}`);
  console.log(`Important Qs:       ${report.importantQuestions}`);
  console.log("By class level:");
  for (const cls of Object.keys(report.byClass).sort()) {
    const r = report.byClass[Number(cls)];
    console.log(`  Class ${cls}: ${r.chapters} chapters, ${r.topics} topics, ${r.questions} question-bank items, ${r.flashcards} flashcards`);
  }
  console.log(`Elapsed: ${elapsedSec}s`);
  console.log("===============================================");
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
