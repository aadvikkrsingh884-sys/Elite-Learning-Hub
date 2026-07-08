import { createHmac } from "crypto";
import { sql } from "drizzle-orm";
import { db, pool, subjectsTable, chaptersTable, topicsTable, testsTable, questionsTable, importantQuestionsTable, studentsTable, bookmarksTable, progressTable, testResultsTable } from "./index";
import { CURRICULUM, GRAMMAR_SUBJECTS } from "./curriculum";

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

// Subject-aware topic templates — every chapter gets a full, meaningful set of
// sub-topics (not an arbitrary fixed count copy-pasted across subjects).
const TOPIC_TEMPLATES: Record<string, (title: string) => string[]> = {
  Mathematics: (t) => [
    `${t} — Key Concepts & Definitions`,
    `${t} — Solved Examples`,
    `${t} — Practice Problems & Exercises`,
    `${t} — Common Mistakes & Exam Tips`,
  ],
  Science: (t) => [
    `${t} — Understanding the Concept`,
    `${t} — Key Terms & Diagrams`,
    `${t} — Activities & Experiments`,
    `${t} — Real-World Applications`,
  ],
  "Social Science": (t) => [
    `${t} — Overview & Key Facts`,
    `${t} — Important Dates, Terms & Figures`,
    `${t} — Map Work & Case Studies`,
    `${t} — Analytical & HOTS Questions`,
  ],
  English: (t) => [
    `${t} — Summary`,
    `${t} — Theme & Message`,
    `${t} — Character & Word Analysis`,
    `${t} — Comprehension & Word Meanings`,
  ],
  Hindi: (t) => [
    `${t} — सारांश (Summary)`,
    `${t} — भावार्थ एवं संदेश (Theme & Message)`,
    `${t} — शब्दार्थ एवं व्याख्या (Word Meanings)`,
    `${t} — अभ्यास प्रश्न (Practice Questions)`,
  ],
  "English Grammar": (t) => [
    `${t} — Rules & Definitions`,
    `${t} — Examples & Usage`,
    `${t} — Common Errors`,
    `${t} — Practice Exercises`,
  ],
  "Hindi Grammar": (t) => [
    `${t} — नियम एवं परिभाषा (Rules)`,
    `${t} — उदाहरण एवं प्रयोग (Examples)`,
    `${t} — सामान्य त्रुटियाँ (Common Errors)`,
    `${t} — अभ्यास (Practice)`,
  ],
};

async function main() {
  console.log("Seeding AuraLearning database with the full 2026-27 curriculum...");

  await db.transaction(async (db) => {
    // Reset seedable tables so this script is safely re-runnable. Truncate in
    // the same transaction as the inserts below, so a failure anywhere leaves
    // the database untouched instead of half-reseeded.
    await db.execute(sql`TRUNCATE TABLE
      ${bookmarksTable}, ${progressTable}, ${testResultsTable}, ${questionsTable},
      ${importantQuestionsTable}, ${testsTable}, ${topicsTable}, ${chaptersTable},
      ${subjectsTable}, ${studentsTable}
      RESTART IDENTITY CASCADE`);

    // 1. Subjects — 5 core subjects x classes 6-10, plus 2 global Grammar
    // subjects (classLevel 0, shared across all classes — see Subjects.tsx
    // which already fetches classLevel:0 subjects as "Grammar" tabs).
    const subjectIdByClassName = new Map<string, number>();
    let subjectCount = 0;
    for (const classLevel of CLASS_LEVELS) {
      for (const name of CORE_SUBJECT_NAMES) {
        const meta = SUBJECT_META[name];
        const [row] = await db.insert(subjectsTable).values({
          name, classLevel, icon: meta.icon, color: meta.color,
        }).returning();
        subjectIdByClassName.set(`${classLevel}:${name}`, row.id);
        subjectCount++;
      }
    }
    const grammarSubjectId = new Map<string, number>();
    for (const name of Object.keys(GRAMMAR_SUBJECTS)) {
      const meta = SUBJECT_META[name];
      const [row] = await db.insert(subjectsTable).values({
        name, classLevel: 0, icon: meta.icon, color: meta.color,
      }).returning();
      grammarSubjectId.set(name, row.id);
      subjectCount++;
    }
    console.log(`Inserted ${subjectCount} subjects`);

    // 2. Chapters — full chapter list for every subject, every class (sourced
    // from the 2026-27 curriculum PDF; see curriculum.ts header for the small
    // number of documented gaps filled from the standard NCERT sequence).
    // Keyed by (classLevel, subjectId, title) so identical chapter titles that
    // recur across different classes (e.g. "Acids, Bases and Salts" appears in
    // both Class 7 and Class 10 Science) don't collide.
    const chapterIdByKey = new Map<string, number>();
    let chapterCount = 0;
    for (const classLevel of CLASS_LEVELS) {
      for (const name of CORE_SUBJECT_NAMES) {
        const subjectId = subjectIdByClassName.get(`${classLevel}:${name}`)!;
        const chapters = CURRICULUM[name]?.[classLevel] ?? [];
        for (let i = 0; i < chapters.length; i++) {
          const [row] = await db.insert(chaptersTable).values({
            subjectId, number: i + 1, title: chapters[i],
            description: `Chapter ${i + 1} of Class ${classLevel} ${name}`,
          }).returning();
          chapterIdByKey.set(`${classLevel}:${name}:${chapters[i]}`, row.id);
          chapterCount++;
        }
      }
    }
    for (const name of Object.keys(GRAMMAR_SUBJECTS)) {
      const subjectId = grammarSubjectId.get(name)!;
      const chapters = GRAMMAR_SUBJECTS[name];
      for (let i = 0; i < chapters.length; i++) {
        const [row] = await db.insert(chaptersTable).values({
          subjectId, number: i + 1, title: chapters[i],
          description: `Unit ${i + 1} of ${name}`,
        }).returning();
        chapterIdByKey.set(`0:${name}:${chapters[i]}`, row.id);
        chapterCount++;
      }
    }
    console.log(`Inserted ${chapterCount} chapters`);

    // 3. Topics — every chapter gets a full set of subject-appropriate topics.
    // The 2nd topic in every chapter is flagged important for variety in the UI.
    let topicCount = 0;
    for (const [key, chapterId] of chapterIdByKey.entries()) {
      const [, subjectName, ...rest] = key.split(":");
      const chapterTitle = rest.join(":");
      const template = TOPIC_TEMPLATES[subjectName];
      const topics = template(chapterTitle);
      for (let i = 0; i < topics.length; i++) {
        await db.insert(topicsTable).values({
          chapterId, title: topics[i], isImportant: i === 1 ? 1 : 0,
        });
        topicCount++;
      }
    }
    console.log(`Inserted ${topicCount} topics`);

    // 4. Tests across classes with difficulty levels, referencing real chapters
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
    console.log(`Inserted ${testDefs.length} tests`);

    // 5. Questions for a handful of key tests
    function makeMCQs(prefix: string, count: number) {
      return Array.from({ length: count }, (_, i) => ({
        text: `${prefix} — sample question ${i + 1}`,
        type: "multiple_choice",
        optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D",
        correctOption: (i % 4) + 1,
        explanation: `Explanation for ${prefix} question ${i + 1}.`,
      }));
    }

    let questionCount = 0;
    const questionSets: [string, ReturnType<typeof makeMCQs>][] = [
      ["Rational Numbers Test", makeMCQs("Rational Numbers", 20)],
      ["Algebraic Expressions Test", makeMCQs("Algebraic Expressions", 20)],
      ["Force and Pressure Test", makeMCQs("Force and Pressure", 5)],
    ];
    for (const [testTitle, qs] of questionSets) {
      const testId = testIdByTitle.get(testTitle)!;
      for (const q of qs) {
        await db.insert(questionsTable).values({ testId, ...q });
        questionCount++;
      }
    }
    console.log(`Inserted ${questionCount} questions`);

    // 6. Important questions across subjects for classes 6-10, referencing real chapters
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
      { subject: "Science", chapter: "Combustion and Flame", classLevel: 8, difficulty: "easy", text: "What are the three essential conditions for combustion?", solution: "Presence of a combustible substance, supporter of combustion (usually oxygen), and ignition temperature.", frequency: undefined },
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
    console.log(`Inserted ${importantQs.length} important questions`);

    // 7. Demo student
    await db.insert(studentsTable).values({
      name: "Demo Student",
      email: "demo@auralearning.com",
      passwordHash: hashPassword("password123"),
      classLevel: 8,
      points: 2450,
      avatarUrl: null,
    });
    console.log("Inserted demo student (demo@auralearning.com / password123)");
  }); // end transaction

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
