import { createHmac } from "crypto";
import { sql } from "drizzle-orm";
import { db, pool, subjectsTable, chaptersTable, topicsTable, testsTable, questionsTable, importantQuestionsTable, studentsTable, bookmarksTable, progressTable, testResultsTable } from "./index";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set before seeding (it salts the demo student's password hash).");
}
const SECRET = process.env.SESSION_SECRET;
function hashPassword(password: string): string {
  const salt = "aura_learning_salt_2026";
  return createHmac("sha256", SECRET).update(password + salt).digest("hex");
}

const SUBJECT_NAMES = ["Mathematics", "Science", "Social Studies", "English", "Hindi"] as const;
const SUBJECT_META: Record<string, { icon: string; color: string }> = {
  Mathematics: { icon: "calculator", color: "#2563eb" },
  Science: { icon: "flask-conical", color: "#16a34a" },
  "Social Studies": { icon: "globe", color: "#d97706" },
  English: { icon: "book-open", color: "#dc2626" },
  Hindi: { icon: "languages", color: "#7c3aed" },
};

const CLASS8_CHAPTERS: Record<string, string[]> = {
  Mathematics: [
    "Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry",
    "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities",
    "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers",
    "Direct and Inverse Proportions", "Introduction to Graphs",
  ],
  Science: [
    "Crop Production and Management", "Microorganisms", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals",
    "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell Structure and Functions",
    "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction",
    "Sound", "Chemical Effects of Electric Current", "Light",
  ],
  "Social Studies": [
    "How, When and Where", "From Trade to Territory", "Ruling the Countryside", "Tribals, Dikus and the Vision of a Golden Age",
    "The Making of the National Movement", "Resources", "Land, Soil, Water, Natural Vegetation and Wildlife", "Agriculture",
    "Industries", "The Indian Constitution",
  ],
  English: [
    "The Best Christmas Present in the World", "The Tsunami", "Glimpses of the Past", "Bepin Choudhury's Lapse of Memory",
    "The Summit Within", "This is Jody's Fawn", "A Visit to Cambridge", "Jalebis",
  ],
  Hindi: [
    "ध्वनि", "लाख की चूड़ियाँ", "बस की यात्रा", "दीवानों की हस्ती",
    "चिट्ठियों की अनूठी दुनिया", "भगवान के डाकिए", "क्या निराश हुआ जाए", "यह सबसे कठिन समय नहीं",
  ],
};

const TOPIC_MAP: Record<string, string[]> = {
  "Rational Numbers": ["Properties of Rational Numbers", "Representation on Number Line", "Rational Numbers Between Two Rational Numbers"],
  "Linear Equations in One Variable": ["Solving Equations with Linear Expressions", "Applications", "Reducing Equations to Simpler Form"],
  "Understanding Quadrilaterals": ["Polygons", "Sum of Angles", "Kinds of Quadrilaterals"],
  "Squares and Square Roots": ["Properties of Squares", "Finding Square Roots", "Square Roots of Decimals"],
  "Algebraic Expressions and Identities": ["Addition and Subtraction", "Multiplication of Algebraic Expressions", "Standard Identities"],
  "Force and Pressure": ["Types of Force", "Pressure", "Atmospheric Pressure"],
  Friction: ["Factors Affecting Friction", "Friction: A Necessary Evil", "Fluid Friction"],
  Sound: ["How Sound is Produced", "Characteristics of Sound", "Audible Range of Hearing"],
  "Cell Structure and Functions": ["Discovery of the Cell", "Structure of Cell", "Comparison of Plant and Animal Cells"],
  Resources: ["Types of Resources", "Resource Planning", "Conservation of Resources"],
  "The Indian Constitution": ["Why Do We Need a Constitution", "Key Features", "Fundamental Rights"],
};

const CLASS_LEVELS = [6, 7, 8, 9, 10];

async function main() {
  console.log("Seeding AuraLearning database...");

  await db.transaction(async (db) => {
  // Reset seedable tables so this script is safely re-runnable. Truncate in
  // the same transaction as the inserts below, so a failure anywhere leaves
  // the database untouched instead of half-reseeded.
  await db.execute(sql`TRUNCATE TABLE
    ${bookmarksTable}, ${progressTable}, ${testResultsTable}, ${questionsTable},
    ${importantQuestionsTable}, ${testsTable}, ${topicsTable}, ${chaptersTable},
    ${subjectsTable}, ${studentsTable}
    RESTART IDENTITY CASCADE`);

  // 1. Subjects for every class 6-10
  const subjectIdByClassName = new Map<string, number>();
  for (const classLevel of CLASS_LEVELS) {
    for (const name of SUBJECT_NAMES) {
      const meta = SUBJECT_META[name];
      const [row] = await db.insert(subjectsTable).values({
        name, classLevel, icon: meta.icon, color: meta.color,
      }).returning();
      subjectIdByClassName.set(`${classLevel}:${name}`, row.id);
    }
  }
  console.log(`Inserted ${CLASS_LEVELS.length * SUBJECT_NAMES.length} subjects`);

  // 2. Chapters — full detail for Class 8, one placeholder chapter for other classes so nothing is empty
  const chapterIdByTitle = new Map<string, number>();
  let chapterCount = 0;
  for (const name of SUBJECT_NAMES) {
    const class8SubjectId = subjectIdByClassName.get(`8:${name}`)!;
    const chapters = CLASS8_CHAPTERS[name];
    for (let i = 0; i < chapters.length; i++) {
      const [row] = await db.insert(chaptersTable).values({
        subjectId: class8SubjectId, number: i + 1, title: chapters[i],
        description: `Chapter ${i + 1} of Class 8 ${name}`,
      }).returning();
      chapterIdByTitle.set(chapters[i], row.id);
      chapterCount++;
    }

    for (const classLevel of CLASS_LEVELS) {
      if (classLevel === 8) continue;
      const subjectId = subjectIdByClassName.get(`${classLevel}:${name}`)!;
      await db.insert(chaptersTable).values({
        subjectId, number: 1, title: `Introduction to ${name} (Class ${classLevel})`,
        description: `Foundational chapter for Class ${classLevel} ${name}`,
      });
      chapterCount++;
    }
  }
  console.log(`Inserted ${chapterCount} chapters`);

  // 3. Topics for key Class 8 chapters
  let topicCount = 0;
  for (const [chapterTitle, topics] of Object.entries(TOPIC_MAP)) {
    const chapterId = chapterIdByTitle.get(chapterTitle);
    if (!chapterId) continue;
    for (const topicTitle of topics) {
      await db.insert(topicsTable).values({
        chapterId, title: topicTitle, isImportant: 0,
      });
      topicCount++;
    }
  }
  console.log(`Inserted ${topicCount} topics`);

  // 4. Tests across classes with difficulty levels
  const testDefs = [
    { title: "Rational Numbers Test", subject: "Mathematics", classLevel: 8, difficulty: "medium", chapterName: "Rational Numbers" },
    { title: "Algebraic Expressions Test", subject: "Mathematics", classLevel: 8, difficulty: "medium", chapterName: "Algebraic Expressions and Identities" },
    { title: "Force and Pressure Test", subject: "Science", classLevel: 8, difficulty: "easy", chapterName: "Force and Pressure" },
    { title: "Cell Structure Test", subject: "Science", classLevel: 8, difficulty: "medium", chapterName: "Cell Structure and Functions" },
    { title: "Resources Test", subject: "Social Studies", classLevel: 8, difficulty: "easy", chapterName: "Resources" },
    { title: "Indian Constitution Test", subject: "Social Studies", classLevel: 8, difficulty: "medium", chapterName: "The Indian Constitution" },
    { title: "Class 6 Mathematics Basics", subject: "Mathematics", classLevel: 6, difficulty: "easy" },
    { title: "Class 6 Science Basics", subject: "Science", classLevel: 6, difficulty: "easy" },
    { title: "Class 7 Mathematics Practice", subject: "Mathematics", classLevel: 7, difficulty: "medium" },
    { title: "Class 7 Science Practice", subject: "Science", classLevel: 7, difficulty: "medium" },
    { title: "Class 9 Mathematics Challenge", subject: "Mathematics", classLevel: 9, difficulty: "hard" },
    { title: "Class 9 Science Challenge", subject: "Science", classLevel: 9, difficulty: "hard" },
    { title: "Class 10 Mathematics Board Prep", subject: "Mathematics", classLevel: 10, difficulty: "hard" },
    { title: "Class 10 Science Board Prep", subject: "Science", classLevel: 10, difficulty: "hard" },
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

  // 5. Questions for three key tests
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

  // 6. Important questions across Math/Science/Social Studies/English for classes 8-10
  const importantQs: { subject: string; chapter: string; classLevel: number; difficulty: string; text: string; solution: string; frequency?: string; year?: string }[] = [
    { subject: "Mathematics", chapter: "Rational Numbers", classLevel: 8, difficulty: "medium", text: "Prove that the sum of two rational numbers is always rational.", solution: "Let a/b and c/d be rational numbers. Their sum (ad+bc)/bd is a ratio of integers, hence rational.", frequency: "Very Common", year: "2024" },
    { subject: "Mathematics", chapter: "Algebraic Expressions and Identities", classLevel: 8, difficulty: "medium", text: "Expand (a+b)^3 using the standard identity.", solution: "(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3.", frequency: "Common Question" },
    { subject: "Mathematics", chapter: "Squares and Square Roots", classLevel: 8, difficulty: "easy", text: "Find the square root of 1024 by prime factorisation.", solution: "1024 = 2^10, so sqrt(1024) = 2^5 = 32." },
    { subject: "Science", chapter: "Force and Pressure", classLevel: 8, difficulty: "medium", text: "Explain why a sharp knife cuts better than a blunt one.", solution: "A sharp knife has a smaller area of contact, so for the same force the pressure exerted is higher." },
    { subject: "Science", chapter: "Cell Structure and Functions", classLevel: 8, difficulty: "easy", text: "Differentiate between plant cells and animal cells.", solution: "Plant cells have a cell wall, chloroplasts, and a large vacuole; animal cells lack these." },
    { subject: "Science", chapter: "Sound", classLevel: 8, difficulty: "medium", text: "Why can we not hear the sound produced by a vibrating pendulum?", solution: "Its frequency is too low, below 20 Hz, which is outside the audible range for humans." },
    { subject: "Social Studies", chapter: "Resources", classLevel: 8, difficulty: "easy", text: "Distinguish between renewable and non-renewable resources with examples.", solution: "Renewable resources (sunlight, wind) can be replenished naturally; non-renewable ones (coal, petroleum) cannot be replenished within a human lifetime." },
    { subject: "Social Studies", chapter: "The Indian Constitution", classLevel: 8, difficulty: "medium", text: "Why is the Indian Constitution called a living document?", solution: "It can be amended to reflect changing needs of society through Articles 368 amendment procedures." },
    { subject: "English", chapter: "The Best Christmas Present in the World", classLevel: 8, difficulty: "easy", text: "What was the significance of the Christmas Truce of 1914?", solution: "It showed that even in war, humanity and compassion can bring enemy soldiers together peacefully." },
    { subject: "Mathematics", chapter: "Introduction to Mathematics (Class 9)", classLevel: 9, difficulty: "hard", text: "Prove that root 2 is an irrational number.", solution: "Assume root 2 = p/q in lowest terms; deriving a contradiction shows p and q share a common factor, so root 2 cannot be rational." },
    { subject: "Science", chapter: "Introduction to Science (Class 9)", classLevel: 9, difficulty: "medium", text: "State the laws of reflection of light.", solution: "The angle of incidence equals the angle of reflection, and the incident ray, reflected ray, and normal lie in the same plane." },
    { subject: "Social Studies", chapter: "Introduction to Social Studies (Class 9)", classLevel: 9, difficulty: "medium", text: "What were the main causes of the French Revolution?", solution: "Social inequality, financial crisis, and Enlightenment ideas about liberty and equality." },
    { subject: "Mathematics", chapter: "Introduction to Mathematics (Class 10)", classLevel: 10, difficulty: "hard", text: "State and prove the Pythagoras theorem.", solution: "In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides; proved using similar triangles." },
    { subject: "Science", chapter: "Introduction to Science (Class 10)", classLevel: 10, difficulty: "hard", text: "Explain the process of electrolysis of water.", solution: "Passing electric current through acidified water decomposes it into hydrogen and oxygen gases at the respective electrodes." },
    { subject: "Social Studies", chapter: "Introduction to Social Studies (Class 10)", classLevel: 10, difficulty: "medium", text: "Explain the concept of sustainable development.", solution: "Development that meets present needs without compromising the ability of future generations to meet their own needs." },
    { subject: "English", chapter: "Introduction to English (Class 10)", classLevel: 10, difficulty: "easy", text: "Summarise the central theme of a poem you've studied about nature.", solution: "Answers vary; focus on the poet's message about humanity's connection with the natural world." },
    { subject: "Mathematics", chapter: "Understanding Quadrilaterals", classLevel: 8, difficulty: "medium", text: "Find the sum of interior angles of a hexagon.", solution: "Sum = (n-2) x 180 = (6-2) x 180 = 720 degrees." },
    { subject: "Science", chapter: "Friction", classLevel: 8, difficulty: "easy", text: "Why is friction called a necessary evil?", solution: "It causes wear and tear and wastes energy, but without it we could not walk, write, or hold objects." },
    { subject: "Social Studies", chapter: "Agriculture", classLevel: 8, difficulty: "medium", text: "What is meant by 'Green Revolution' in India?", solution: "A period of major agricultural growth through high-yield seeds, irrigation, and fertilizers starting in the 1960s." },
    { subject: "Mathematics", chapter: "Mensuration", classLevel: 8, difficulty: "medium", text: "Derive the formula for the surface area of a cylinder.", solution: "Total surface area = 2*pi*r*(r + h), combining the curved surface area and the two circular ends." },
    { subject: "Science", chapter: "Combustion and Flame", classLevel: 8, difficulty: "easy", text: "What are the three essential conditions for combustion?", solution: "Presence of a combustible substance, supporter of combustion (usually oxygen), and ignition temperature." },
    { subject: "Social Studies", chapter: "Industries", classLevel: 8, difficulty: "medium", text: "Classify industries on the basis of raw material used.", solution: "Agro-based, mineral-based, marine-based, and forest-based industries." },
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
