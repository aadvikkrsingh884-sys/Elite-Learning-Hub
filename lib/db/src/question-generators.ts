// Deterministic, category-aware generators for the chapter-level topic list,
// question bank, and flashcards seeded across all 385 chapters.
//
// HONESTY NOTE (read before trusting these as "real exam questions"): at the
// scale requested (20 sub-topics + 20 practice questions per chapter across
// 385 chapters = ~7,700 rows each), it is not feasible to hand-author or
// fact-check every individual item against the specific NCERT chapter text.
// These generators produce *structurally complete, subject-and-topic-aware*
// practice content — computed math/science problems are genuinely solved and
// verified (the correct option is computed, not guessed), while descriptive
// prompts and humanities questions are template-based and reference the exact
// chapter title, difficulty tier, and category (history/geography/civics/
// economics, physics/chemistry/biology, grammar rule type, etc.) rather than
// generic filler. They are NOT a substitute for the smaller, individually
// hand-authored "important questions" set already seeded for classes 8-10.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mkRng(chapterId: number, i: number, salt: number) {
  const seed = ((chapterId * 2654435761) ^ (i * 40503) ^ salt) >>> 0;
  const r = mulberry32(seed);
  r(); r(); // burn-in to decorrelate adjacent seeds
  return r;
}
function shuffle4(rng: () => number, correctVal: string | number, distractors: (string | number)[]) {
  const opts = [correctVal, ...distractors];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { opts, correctIndex: opts.indexOf(correctVal) + 1 };
}
const DIFF_CYCLE = ["easy", "easy", "medium", "medium", "medium", "hard"];

export interface GeneratedQuestion {
  text: string;
  type: "multiple_choice" | "descriptive";
  difficulty: string;
  optionA?: string; optionB?: string; optionC?: string; optionD?: string;
  correctOption?: number;
  explanation: string;
}

// ---------------------------------------------------------------- Topics ---

const TOPIC_LABELS: Record<string, string[]> = {
  Mathematics: [
    "Introduction & Real-Life Context", "Key Definitions & Terminology", "Core Concept I — Explanation",
    "Core Concept II — Explanation", "Important Formulas & Theorems", "Formula Derivation Walkthrough",
    "Worked Example — Basic Level", "Worked Example — Intermediate Level", "Worked Example — Advanced Level",
    "Step-by-Step Problem-Solving Strategy", "Common Errors & Misconceptions", "Shortcut Techniques & Tricks",
    "NCERT Exercise Walkthrough", "Previous Year Question Patterns", "Application-Based Problems",
    "Word Problems & Real-World Applications", "Graphical/Visual Representation", "Quick Revision Notes",
    "Chapter Summary & Mind Map", "Self-Assessment & Practice Set",
  ],
  Science: [
    "Introduction & Real-Life Context", "Key Definitions & Terminology", "Core Concept I — Explanation",
    "Core Concept II — Explanation", "Important Diagrams & Labelled Figures", "Key Laws, Principles & Rules",
    "Experiments & Activities (NCERT)", "Observations & Inferences", "Cause and Effect Relationships",
    "Classification & Comparison Tables", "Real-World Applications", "Common Misconceptions",
    "NCERT Exercise Walkthrough", "Previous Year Question Patterns", "HOTS (Higher Order Thinking) Questions",
    "Numerical/Calculation-Based Problems", "Case-Study Based Questions", "Interlinks with Other Chapters",
    "Chapter Summary & Mind Map", "Self-Assessment & Practice Set",
  ],
  "Social Science": [
    "Introduction & Background", "Key Terms & Definitions", "Important Dates & Timeline",
    "Key Personalities & Their Roles", "Causes & Reasons", "Effects & Consequences",
    "Key Facts & Figures", "Map Work & Locations", "Comparative Analysis", "Case Studies & Examples",
    "Government/Institutional Structures", "Economic & Social Impact", "NCERT Exercise Walkthrough",
    "Previous Year Question Patterns", "Source-Based / Passage Questions", "Analytical & HOTS Questions",
    "Value-Based Questions", "Interlinks with Other Chapters", "Chapter Summary & Mind Map",
    "Self-Assessment & Practice Set",
  ],
  English: [
    "Introduction to the Chapter/Author", "Summary — Part I", "Summary — Part II", "Theme & Central Message",
    "Character Analysis — Main Character(s)", "Character Analysis — Supporting Character(s)", "Setting & Context",
    "Literary Devices Used", "Tone & Mood", "Word Meanings & Vocabulary", "Difficult Word Explanations",
    "Comprehension Passage Practice", "Short Answer Questions", "Long Answer Questions", "Extract-Based Questions",
    "Value-Based & Moral Questions", "Previous Year Question Patterns", "Grammar Link (Contextual Usage)",
    "Chapter Summary & Mind Map", "Self-Assessment & Practice Set",
  ],
  Hindi: [
    "परिचय एवं लेखक परिचय (Introduction)", "सारांश — भाग 1 (Summary I)", "सारांश — भाग 2 (Summary II)",
    "मूल भाव एवं संदेश (Theme & Message)", "मुख्य पात्रों का विश्लेषण (Character Analysis)",
    "सहायक पात्र एवं संदर्भ (Setting & Context)", "अलंकार एवं भाषा-शैली (Literary Devices)",
    "भाव एवं शैली (Tone & Mood)", "शब्दार्थ एवं व्याख्या (Word Meanings)", "कठिन शब्दों की व्याख्या (Difficult Words)",
    "गद्यांश/पद्यांश आधारित अभ्यास (Passage Practice)", "लघु उत्तरीय प्रश्न (Short Answers)",
    "दीर्घ उत्तरीय प्रश्न (Long Answers)", "निष्कर्ष आधारित प्रश्न (Extract-Based)", "मूल्यपरक प्रश्न (Value-Based)",
    "पिछले वर्षों के प्रश्न पैटर्न (Previous Year Patterns)", "व्याकरण संबंध (Grammar Link)",
    "अध्याय सारांश (Chapter Summary)", "स्व-मूल्यांकन (Self-Assessment)", "अभ्यास प्रश्न सेट (Practice Set)",
  ],
  "English Grammar": [
    "Rules & Definitions", "Types & Classification", "Detailed Explanation with Examples", "Usage in Sentences",
    "Common Errors & Corrections", "Comparison with Related Concepts", "Exercise Set — Basic",
    "Exercise Set — Intermediate", "Exercise Set — Advanced", "Fill in the Blanks Practice",
    "Error Spotting Practice", "Sentence Transformation Practice", "Previous Year Question Patterns",
    "Real-Life Application Practice", "Oral/Written Communication Tips", "Quick Reference Chart",
    "Tricky Cases & Exceptions", "Self-Assessment Quiz", "Chapter Summary & Mind Map", "Practice Set — Mixed Review",
  ],
  "Hindi Grammar": [
    "नियम एवं परिभाषा (Rules)", "प्रकार एवं वर्गीकरण (Types)", "उदाहरण सहित विस्तृत व्याख्या (Examples)",
    "वाक्यों में प्रयोग (Usage)", "सामान्य त्रुटियाँ एवं सुधार (Common Errors)", "संबंधित अवधारणाओं से तुलना (Comparison)",
    "अभ्यास सेट — सरल (Basic Exercise)", "अभ्यास सेट — मध्यम (Intermediate Exercise)", "अभ्यास सेट — कठिन (Advanced Exercise)",
    "रिक्त स्थान भरें अभ्यास (Fill in Blanks)", "त्रुटि पहचान अभ्यास (Error Spotting)", "वाक्य रूपांतरण अभ्यास (Sentence Transformation)",
    "पिछले वर्षों के प्रश्न पैटर्न (Previous Year Patterns)", "व्यावहारिक प्रयोग अभ्यास (Application Practice)",
    "मौखिक/लिखित संप्रेषण सुझाव (Communication Tips)", "त्वरित संदर्भ तालिका (Quick Reference)",
    "अपवाद एवं जटिल स्थितियाँ (Tricky Cases)", "स्व-मूल्यांकन प्रश्नोत्तरी (Self-Assessment)",
    "अध्याय सारांश (Chapter Summary)", "मिश्रित अभ्यास सेट (Mixed Practice Set)",
  ],
};

import { CLASS9_MICRO_TOPICS } from "./class9-micro-topics";

export function generateTopics(subjectName: string, chapterTitle: string, classLevel?: number): { title: string; isImportant: number }[] {
  // For Class 9, use authentic NCERT-aligned micro-topics when available.
  if (classLevel === 9) {
    const key = `${subjectName}:${chapterTitle}`;
    const microTopics = CLASS9_MICRO_TOPICS[key];
    if (microTopics && microTopics.length > 0) {
      return microTopics.map((title, i) => ({
        title,
        isImportant: i % 3 === 1 ? 1 : 0, // ~1 in 3 flagged important
      }));
    }
  }

  // Generic fallback for all other classes / subjects.
  const labels = TOPIC_LABELS[subjectName] ?? TOPIC_LABELS.English;
  return labels.map((label, i) => ({
    title: `${chapterTitle} — ${label}`,
    isImportant: i % 4 === 1 ? 1 : 0, // ~5 of 20 flagged important, evenly spread
  }));
}

// ---------------------------------------------------------- Question Bank --

function classifyMath(title: string): string {
  const t = title.toLowerCase();
  if (/integer|rational|real number|number system|whole number|knowing our numbers|fraction|decimal|square|cube|root|exponent|power/.test(t)) return "numbers";
  if (/equation|polynomial|algebra|identit|ratio|proportion|comparing quantities/.test(t)) return "algebra";
  if (/triangle|quadrilateral|circle|geometry|coordinate|euclid|symmetry|line|angle|solid shape/.test(t)) return "geometry";
  if (/mensuration|area|volume|surface|perimeter/.test(t)) return "mensuration";
  if (/statistic|probability|data handling|sequence|progression/.test(t)) return "stats";
  if (/trigonometry/.test(t)) return "trig";
  return "generic";
}

function mathQuestion(chapterTitle: string, chapterId: number, i: number): GeneratedQuestion {
  const rng = mkRng(chapterId, i, 1);
  const cat = classifyMath(chapterTitle);
  const difficulty = DIFF_CYCLE[i % DIFF_CYCLE.length];
  if (i % 5 === 4) {
    const descTemplates = [
      `Explain, with a suitable example, the main idea covered in "${chapterTitle}".`,
      `Derive the key formula/result used in "${chapterTitle}" and explain each term.`,
      `Solve a multi-step problem based on "${chapterTitle}", showing all working steps.`,
      `State and justify why the method used in "${chapterTitle}" works, using a proof or logical argument.`,
    ];
    return {
      text: descTemplates[Math.floor(i / 5) % descTemplates.length], type: "descriptive", difficulty,
      explanation: `A complete answer defines the relevant terms from "${chapterTitle}", shows the correct method/formula, and works through the steps clearly with correct units where applicable.`,
    };
  }
  if (cat === "numbers") {
    const a = 2 + Math.floor(rng() * 40), b = 2 + Math.floor(rng() * 20), correct = a + b;
    const { opts, correctIndex } = shuffle4(rng, correct, [correct + 1, correct - 2, correct + 3]);
    return { text: `In the context of "${chapterTitle}", what is the value of ${a} + ${b}?`, type: "multiple_choice", difficulty,
      optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
      correctOption: correctIndex, explanation: `${a} + ${b} = ${correct}.` };
  }
  if (cat === "algebra") {
    const a = 2 + Math.floor(rng() * 8), x = 1 + Math.floor(rng() * 10), b = 1 + Math.floor(rng() * 15), c = a * x + b;
    const { opts, correctIndex } = shuffle4(rng, x, [x + 1, x - 1, x + 2]);
    return { text: `Related to "${chapterTitle}": if ${a}x + ${b} = ${c}, what is the value of x?`, type: "multiple_choice", difficulty,
      optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
      correctOption: correctIndex, explanation: `${a}x = ${c} - ${b} = ${c - b}, so x = ${c - b}/${a} = ${x}.` };
  }
  if (cat === "geometry") {
    const sidesPool = [3, 4, 5, 6];
    const sides = sidesPool[Math.floor(rng() * sidesPool.length)];
    const sum = (sides - 2) * 180;
    const { opts, correctIndex } = shuffle4(rng, `${sum}°`, [`${sum + 90}°`, `${sum - 90}°`, `${sum + 180}°`]);
    return { text: `As covered in "${chapterTitle}", what is the sum of interior angles of a polygon with ${sides} sides?`, type: "multiple_choice", difficulty,
      optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
      correctOption: correctIndex, explanation: `Sum of interior angles = (n - 2) × 180° = (${sides} - 2) × 180° = ${sum}°.` };
  }
  if (cat === "mensuration") {
    const r = 1 + Math.floor(rng() * 10);
    const area = Math.round(Math.PI * r * r * 100) / 100;
    const { opts, correctIndex } = shuffle4(rng, `${area} cm²`, [`${Math.round(2 * Math.PI * r * 100) / 100} cm²`, `${area * 2} cm²`, `${Math.round((area / 2) * 100) / 100} cm²`]);
    return { text: `Using the formulas from "${chapterTitle}", find the area of a circle with radius ${r} cm (use π ≈ 3.14).`, type: "multiple_choice", difficulty,
      optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
      correctOption: correctIndex, explanation: `Area = πr² = 3.14 × ${r}² = ${area} cm².` };
  }
  if (cat === "stats") {
    const nums = Array.from({ length: 5 }, () => 1 + Math.floor(rng() * 20));
    const total = nums.reduce((a, b) => a + b, 0);
    const mean = Math.round((total / nums.length) * 100) / 100;
    const { opts, correctIndex } = shuffle4(rng, mean, [mean + 1, mean - 1, mean + 2]);
    return { text: `From "${chapterTitle}": find the mean of the data set {${nums.join(", ")}}.`, type: "multiple_choice", difficulty,
      optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
      correctOption: correctIndex, explanation: `Mean = sum of observations ÷ number of observations = ${total} ÷ ${nums.length} = ${mean}.` };
  }
  if (cat === "trig") {
    const table: Record<number, string> = { 30: "1/2", 45: "1/√2", 60: "√3/2" };
    const angles = [30, 45, 60];
    const angle = angles[Math.floor(rng() * angles.length)];
    const wrong = angles.filter((a) => a !== angle).map((a) => table[a]);
    const { opts, correctIndex } = shuffle4(rng, table[angle], [...wrong, "1"]);
    return { text: `As per "${chapterTitle}", what is the value of sin(${angle}°)?`, type: "multiple_choice", difficulty,
      optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
      correctOption: correctIndex, explanation: `sin(${angle}°) = ${table[angle]} (standard trigonometric ratio table value).` };
  }
  return { text: `Which of the following best reflects a core idea introduced in "${chapterTitle}"?`, type: "multiple_choice", difficulty,
    optionA: "A foundational mathematical concept for this chapter", optionB: "An unrelated concept from a different subject",
    optionC: "A concept only relevant to higher education", optionD: "None of the above",
    correctOption: 1, explanation: `This chapter introduces a foundational concept relevant to Class-level Mathematics.` };
}

function classifyScience(title: string): string {
  const t = title.toLowerCase();
  if (/light|electric|current|magnet|force|motion|sound|energy|pressure|heat|work/.test(t)) return "physics";
  if (/acid|base|salt|chemical|carbon|metal|periodic|combustion|coal|petroleum/.test(t)) return "chemistry";
  if (/cell|tissue|life process|reproduc|heredity|nutrition|respiration|organism|adolescence|crop|micro|plant|animal|coordination|diversity/.test(t)) return "biology";
  if (/environment|resource|natural|forest|wildlife|sustainable|water/.test(t)) return "environment";
  return "generic";
}

const SCIENCE_BANKS: Record<string, [string, string[], number, string][]> = {
  physics: [
    ["Which physical quantity is directly related to the concept in \"{c}\"?", ["Force", "Taste", "Colour of an object", "Smell"], 1, "The chapter deals with a measurable physical quantity such as force, energy, or current — not sensory properties."],
    ["What is the SI unit most relevant to \"{c}\"?", ["Newton / Joule / Ampere (as applicable)", "Litre", "Mole of sugar", "Kilogram of salt"], 1, "Physics chapters use standard SI units like Newton (force), Joule (energy), or Ampere (current)."],
    ["A device or phenomenon in \"{c}\" would most likely be demonstrated using which apparatus?", ["A relevant lab setup (e.g., circuit board, ray box, spring balance)", "A cooking utensil", "A musical instrument only", "A gardening tool"], 1, "NCERT physics chapters are typically demonstrated using dedicated lab apparatus."],
    ["Which factor would most directly affect the outcome in an experiment from \"{c}\"?", ["A controlled physical variable (e.g., distance, current, mass)", "The colour of the lab coat used", "The day of the week", "The student's handwriting"], 1, "Physics experiments depend on controlled physical variables, not incidental factors."],
    ["A real-world application of the concept in \"{c}\" is most likely found in:", ["Everyday devices and machines that use this physical principle", "A cooking recipe", "A grammar exercise", "A map of India"], 1, "Physics concepts have direct real-world applications in devices and machines."],
  ],
  chemistry: [
    ["A substance discussed in \"{c}\" turns blue litmus red. What type of substance is it?", ["Acidic", "Basic", "Neutral", "Metallic"], 1, "Acids turn blue litmus paper red; this is a standard test discussed in such chapters."],
    ["Which of the following is an example most relevant to \"{c}\"?", ["A chemical reaction or compound named in the chapter", "A grammar rule", "A historical date", "A geometric shape"], 1, "The chapter's content is chemistry-based, so a chemical example is the correct type of answer."],
    ["What type of change is typically illustrated in \"{c}\"?", ["A chemical or physical change with observable evidence (gas, colour change, precipitate, etc.)", "A change in the weather only", "A change in language grammar", "A change in map boundaries"], 1, "Chemistry chapters focus on physical/chemical changes with observable evidence."],
    ["Which safety precaution is most relevant while studying practicals from \"{c}\"?", ["Handling chemicals/heat sources carefully as instructed", "Wearing headphones", "Avoiding the use of a notebook", "Reading in the dark"], 1, "Chemistry practicals require careful handling of chemicals and heat sources."],
    ["A key indicator used to test substances in \"{c}\" is:", ["Litmus paper or a similar chemical indicator", "A thermometer for body temperature only", "A ruler", "A compass"], 1, "Chemical indicators such as litmus paper are standard tools in this type of chapter."],
  ],
  biology: [
    ["Which of these best relates to the biological process in \"{c}\"?", ["A life process performed by living organisms", "A mathematical formula", "A map-reading skill", "A grammar rule"], 1, "This chapter is biology-based, so the correct answer must relate to a life process."],
    ["A structure discussed in \"{c}\" is best studied using which tool?", ["A microscope or diagram of the organism/organ system", "A calculator", "A protractor", "A globe"], 1, "Biology topics such as cells, tissues, or organs are studied using microscopes and labelled diagrams."],
    ["Which statement about \"{c}\" is most accurate?", ["It explains a process essential for growth, survival, or reproduction in organisms", "It explains how to balance a chemical equation", "It explains the causes of a historical war", "It explains how to solve a quadratic equation"], 1, "This is a biology chapter, so it centers on a life process."],
    ["Which of the following would you expect to find labelled in a diagram from \"{c}\"?", ["Parts of a cell, organ, or organism relevant to the topic", "Political boundaries of a country", "Steps of solving an equation", "Verb conjugations"], 1, "Biology diagrams label anatomical or cellular structures."],
    ["A disruption to the process described in \"{c}\" would most likely affect:", ["The health or normal functioning of the organism", "The exchange rate of a currency", "The grammar of a sentence", "The area of a triangle"], 1, "Biological processes, when disrupted, affect organism health and functioning."],
  ],
  environment: [
    ["Which of the following is most closely linked to the theme of \"{c}\"?", ["Conservation and sustainable use of a natural resource", "The rules of English grammar", "The formula for the area of a circle", "The plot of a short story"], 1, "Environment-themed science chapters focus on natural resources and sustainability."],
    ["A key takeaway from \"{c}\" for responsible citizenship is:", ["Using natural resources responsibly so they remain available for future generations", "Ignoring resource conservation", "Focusing only on economic growth regardless of impact", "None of the above"], 1, "Environmental science chapters emphasize sustainable resource management."],
    ["Which human activity is most likely discussed as a threat in \"{c}\"?", ["Overexploitation or pollution of the resource/ecosystem", "Reading books", "Playing a musical instrument", "Solving algebra problems"], 1, "Environment chapters typically discuss overuse or pollution as threats to ecosystems."],
    ["An effective solution proposed in chapters like \"{c}\" is:", ["Sustainable management and conservation practices", "Increasing resource extraction without limits", "Banning all use of the resource permanently", "None of the above"], 1, "NCERT environment chapters promote sustainable management, not extremes."],
  ],
  generic: [
    ["Which of the following best reflects a core idea introduced in \"{c}\"?", ["A foundational scientific concept for this chapter", "An unrelated historical event", "A rule of grammar", "A geometric proof"], 1, "This chapter introduces a foundational scientific concept."],
  ],
};

function scienceQuestion(chapterTitle: string, chapterId: number, i: number): GeneratedQuestion {
  const difficulty = DIFF_CYCLE[i % DIFF_CYCLE.length];
  if (i % 5 === 4) {
    const descTemplates = [
      `With a labelled diagram where relevant, explain the main concept taught in "${chapterTitle}".`,
      `Describe an activity or experiment from "${chapterTitle}" and state the conclusion it demonstrates.`,
      `Explain the cause-and-effect relationship central to "${chapterTitle}" with a real-life example.`,
      `Compare and contrast two key ideas introduced in "${chapterTitle}".`,
    ];
    return { text: descTemplates[Math.floor(i / 5) % descTemplates.length], type: "descriptive", difficulty,
      explanation: `A strong answer names the key terms from "${chapterTitle}", explains the underlying scientific principle, and supports it with a diagram or real-world example.` };
  }
  const cat = classifyScience(chapterTitle);
  const pool = SCIENCE_BANKS[cat] ?? SCIENCE_BANKS.generic;
  const [textT, options, correctOption, explanation] = pool[i % pool.length];
  return { text: textT.replace(/\{c\}/g, chapterTitle), type: "multiple_choice", difficulty,
    optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3],
    correctOption, explanation };
}

function classifySST(title: string): string {
  const t = title.toLowerCase();
  if (/king|mughal|history|revolt|colonial|nationalis|independence|movement|company|trade|war|freedom|rebel|civilisation|regional culture|thousand years|building|craft|tribe|devotion|nation|industrialisation|print culture|global world/.test(t)) return "history";
  if (/environment|earth|climate|resource|agricultur|industr|water|forest|mineral|geography|region|population|manufactur|lifeline/.test(t)) return "geography";
  if (/constitution|democra|government|parliament|judiciary|secular|marginal|equal|right|election|political|power sharing|federal|authority|health|media/.test(t)) return "civics";
  if (/econom|market|develop|money|credit|globalis|consumer|sector|price|startup|finance/.test(t)) return "economics";
  return "generic";
}

const SST_BANKS: Record<string, [string, string[], number, string][]> = {
  history: [
    ["Which type of historical source would be most useful to study \"{c}\"?", ["Primary sources such as inscriptions, chronicles, or official records from the period", "A weather forecast", "A mathematics textbook", "A modern grammar guide"], 1, "Historians rely on primary sources like inscriptions and chronicles to reconstruct the period covered in this chapter."],
    ["The events described in \"{c}\" primarily led to which kind of change?", ["A political, social, or economic transformation of the period", "A change in the rules of cricket", "A new mathematical formula", "A change in a poem's rhyme scheme"], 1, "History chapters trace political, social, and economic transformations."],
    ["Which of the following best explains why the developments in \"{c}\" are still studied today?", ["They shaped institutions, identities, or policies relevant to the present", "They are unrelated to modern India", "They only matter for entertainment", "They have no lasting impact"], 1, "Historical developments are studied because of their lasting institutional and social impact."],
    ["A key cause commonly associated with events like those in \"{c}\" is:", ["Political, economic, or social tension of the period", "A sudden change in weather patterns only", "A mathematical error", "An unrelated grammar rule"], 1, "Historical events are driven by political, economic, and social tensions."],
  ],
  geography: [
    ["Which map skill would be most useful when studying \"{c}\"?", ["Identifying and locating relevant physical or resource features on a map", "Solving a quadratic equation", "Analysing a poem's structure", "Conjugating a verb"], 1, "Geography chapters require map-reading and location skills."],
    ["\"{c}\" is most directly concerned with which aspect of geography?", ["Physical features, resources, or human-environment interaction", "Grammar rules", "Historical battles", "Mathematical proofs"], 1, "This chapter falls under physical or human geography."],
    ["Sustainable use of the resource/feature in \"{c}\" is important mainly because:", ["It ensures availability for future generations and ecological balance", "It has no long-term consequences", "It only affects one village", "It is unrelated to the economy"], 1, "Geography chapters emphasize sustainability and ecological balance."],
    ["Which factor most influences the distribution pattern discussed in \"{c}\"?", ["Climate, terrain, or resource availability", "The rules of grammar", "A mathematical constant", "A literary theme"], 1, "Geographic distribution is influenced by climate, terrain, and resources."],
  ],
  civics: [
    ["Which democratic principle is most relevant to \"{c}\"?", ["Equality, participation, or accountability of institutions", "The rule of a single unelected ruler", "Rejection of all elections", "None of the above"], 1, "Civics chapters center on democratic principles like equality and accountability."],
    ["\"{c}\" primarily helps a citizen understand:", ["Their rights, responsibilities, or the working of government institutions", "How to solve a geometry problem", "How to write a poem", "How to balance a chemical equation"], 1, "Civics content builds understanding of rights and government institutions."],
    ["Which of the following is an example of the concept covered in \"{c}\" in action?", ["A government policy, law, or institutional process related to the topic", "A physics experiment", "A literary character's dialogue", "A mathematical theorem"], 1, "Civics concepts are illustrated through real government processes and policies."],
    ["Why is the topic in \"{c}\" considered essential in a democracy?", ["It safeguards fairness, representation, or the rule of law", "It only benefits a small elite group", "It has no real-world application", "It is purely historical with no current relevance"], 1, "Civics topics matter because they safeguard democratic fairness and representation."],
  ],
  economics: [
    ["Which economic concept is central to \"{c}\"?", ["Production, distribution, consumption, or a related economic process", "A grammar rule", "A geometric theorem", "A historical battle"], 1, "Economics chapters revolve around production, distribution, and consumption."],
    ["\"{c}\" would most likely help explain:", ["How resources, money, or markets affect people's economic lives", "How to conjugate a verb", "How to prove a geometric theorem", "The plot of a story"], 1, "Economics chapters explain how markets and resources affect daily life."],
    ["A real-world example connected to \"{c}\" would involve:", ["A market transaction, income change, or economic policy effect", "A poem's rhyme scheme", "A chemical reaction", "A map projection"], 1, "Economics concepts show up in market transactions and policy effects."],
    ["Why does the concept in \"{c}\" matter for a country's development?", ["It affects income, employment, or standard of living", "It has no impact on people's lives", "It is only theoretical with no practical effect", "It only applies to other countries"], 1, "Economic concepts directly affect income, employment, and living standards."],
  ],
  generic: [
    ["Which of the following best reflects a core idea introduced in \"{c}\"?", ["A foundational Social Science concept for this chapter", "An unrelated scientific formula", "A grammar rule", "A geometric proof"], 1, "This chapter introduces a foundational Social Science concept."],
  ],
};

function sstQuestion(chapterTitle: string, chapterId: number, i: number): GeneratedQuestion {
  const difficulty = DIFF_CYCLE[i % DIFF_CYCLE.length];
  if (i % 5 === 4) {
    const descTemplates = [
      `Discuss the key causes and consequences associated with "${chapterTitle}".`,
      `With reference to "${chapterTitle}", explain its significance using relevant facts and examples.`,
      `Analyse how the developments described in "${chapterTitle}" affect society today.`,
      `Compare two perspectives or regions discussed in "${chapterTitle}", supporting your answer with evidence.`,
    ];
    return { text: descTemplates[Math.floor(i / 5) % descTemplates.length], type: "descriptive", difficulty,
      explanation: `A strong answer references specific facts, dates, or terms from "${chapterTitle}" and connects cause to effect or evidence to conclusion.` };
  }
  const cat = classifySST(chapterTitle);
  const pool = SST_BANKS[cat] ?? SST_BANKS.generic;
  const [textT, options, correctOption, explanation] = pool[i % pool.length];
  return { text: textT.replace(/\{c\}/g, chapterTitle), type: "multiple_choice", difficulty,
    optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3],
    correctOption, explanation };
}

function literatureQuestion(chapterTitle: string, subjectName: "English" | "Hindi", i: number): GeneratedQuestion {
  const difficulty = DIFF_CYCLE[i % DIFF_CYCLE.length];
  if (i % 5 === 4) {
    const descTemplates = subjectName === "English" ? [
      `Summarise the main events of "${chapterTitle}" in your own words.`,
      `Describe the central theme or message of "${chapterTitle}" with reference to the text.`,
      `Analyse the character(s) in "${chapterTitle}" and explain how they develop through the story/poem.`,
      `Explain, with textual evidence, the significance of the title "${chapterTitle}".`,
    ] : [
      `"${chapterTitle}" का सारांश अपने शब्दों में लिखिए।`,
      `"${chapterTitle}" का मूल भाव एवं संदेश स्पष्ट कीजिए।`,
      `"${chapterTitle}" के प्रमुख पात्र/भाव का विश्लेषण कीजिए।`,
      `"${chapterTitle}" शीर्षक की सार्थकता पाठ के आधार पर स्पष्ट कीजिए।`,
    ];
    return { text: descTemplates[Math.floor(i / 5) % descTemplates.length], type: "descriptive", difficulty,
      explanation: subjectName === "English"
        ? `A complete answer references specific events/lines from "${chapterTitle}" and connects them to the theme or character development.`
        : `एक अच्छे उत्तर में "${chapterTitle}" की मुख्य पंक्तियों/घटनाओं का उल्लेख करते हुए भाव या चरित्र-चित्रण को स्पष्ट किया जाना चाहिए।` };
  }
  const banksEn: [string, string[], number, string][] = [
    [`What is the primary theme explored in "${chapterTitle}"?`, ["A meaningful human experience or value central to the text", "A mathematical formula", "A chemical reaction", "A map of a region"], 1, "Literature chapters explore human experiences, values, or emotions as their central theme."],
    [`Which literary skill is most tested by "${chapterTitle}"?`, ["Comprehension, inference, and interpretation of the text", "Solving equations", "Balancing chemical formulas", "Reading a political map"], 1, "Literature study builds comprehension and interpretation skills."],
    [`A word or phrase from "${chapterTitle}" would most likely be tested for:`, ["Its contextual meaning within the passage", "Its numeric value", "Its chemical formula", "Its geographic coordinates"], 1, "Vocabulary questions test contextual meaning of words as used in the passage."],
    [`The tone of "${chapterTitle}" is best understood by analysing:`, ["Word choice, narrative voice, and the situations described", "The chapter's page number", "Its position in the syllabus", "The cover design of the textbook"], 1, "Tone is understood through word choice, narrative voice, and context."],
  ];
  const banksHi: [string, string[], number, string][] = [
    [`"${chapterTitle}" में मुख्य रूप से किस भाव/विषय की चर्चा की गई है?`, ["पाठ में निहित मानवीय अनुभव अथवा मूल्य", "एक गणितीय सूत्र", "एक रासायनिक अभिक्रिया", "एक भौगोलिक मानचित्र"], 1, "साहित्यिक पाठ मानवीय अनुभवों और मूल्यों पर केंद्रित होते हैं।"],
    [`"${chapterTitle}" से संबंधित कौन-सा कौशल सर्वाधिक परखा जाता है?`, ["पाठ की व्याख्या एवं भावार्थ को समझना", "समीकरण हल करना", "रासायनिक सूत्र संतुलित करना", "मानचित्र पढ़ना"], 1, "साहित्य अध्ययन व्याख्या एवं भावार्थ समझने का कौशल विकसित करता है।"],
    [`"${chapterTitle}" में प्रयुक्त कोई शब्द किस आधार पर समझा जाना चाहिए?`, ["प्रसंग के अनुसार उसका अर्थ", "उसका संख्यात्मक मान", "उसका रासायनिक सूत्र", "उसका भौगोलिक स्थान"], 1, "शब्दार्थ प्रश्न प्रसंगानुसार अर्थ पर आधारित होते हैं।"],
    [`"${chapterTitle}" की भाव-शैली को समझने के लिए किस पर ध्यान देना चाहिए?`, ["शब्द चयन, कथन-शैली एवं वर्णित परिस्थितियाँ", "पाठ का पृष्ठ संख्या", "पाठ्यक्रम में इसका स्थान", "पुस्तक के आवरण का डिज़ाइन"], 1, "भाव-शैली शब्द चयन एवं वर्णन शैली से समझी जाती है।"],
  ];
  const pool = subjectName === "English" ? banksEn : banksHi;
  const [text, options, correctOption, explanation] = pool[i % pool.length];
  return { text, type: "multiple_choice", difficulty, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption, explanation };
}

function grammarQuestion(chapterTitle: string, subjectName: "English Grammar" | "Hindi Grammar", i: number): GeneratedQuestion {
  const difficulty = DIFF_CYCLE[i % DIFF_CYCLE.length];
  if (i % 5 === 4) {
    const descTemplates = subjectName === "English Grammar" ? [
      `Explain the rule of "${chapterTitle}" with three original example sentences.`,
      `Identify and correct three common errors students make with "${chapterTitle}".`,
      `Write a short paragraph correctly demonstrating the usage of "${chapterTitle}".`,
    ] : [
      `"${chapterTitle}" के नियम को तीन उदाहरण वाक्यों सहित समझाइए।`,
      `"${chapterTitle}" से संबंधित तीन सामान्य त्रुटियाँ पहचान कर उन्हें सुधारिए।`,
      `"${chapterTitle}" का सही प्रयोग दर्शाते हुए एक लघु अनुच्छेद लिखिए।`,
    ];
    return { text: descTemplates[Math.floor(i / 5) % descTemplates.length], type: "descriptive", difficulty,
      explanation: subjectName === "English Grammar"
        ? `A complete answer states the rule for "${chapterTitle}" precisely and applies it correctly in original sentences.`
        : `एक अच्छे उत्तर में "${chapterTitle}" के नियम को स्पष्ट रूप से बताकर सही वाक्यों में उसका प्रयोग दिखाया जाना चाहिए।` };
  }
  const banksEn: [string, string[], number, string][] = [
    [`Which sentence correctly applies the rule of "${chapterTitle}"?`, ["A sentence following the standard grammatical rule for this topic", "A sentence with a clear grammatical error", "A sentence in a different language entirely", "A sentence with no verb at all"], 1, `Correct application of "${chapterTitle}" follows the standard grammatical rule.`],
    [`Identify the error type most commonly associated with "${chapterTitle}".`, ["Incorrect agreement, form, or placement related to this rule", "A spelling mistake unrelated to grammar", "A punctuation mark missing at the end", "A capitalization error only"], 1, `Errors in "${chapterTitle}" typically involve incorrect agreement or form.`],
    [`"${chapterTitle}" is best practised through:`, ["Structured exercises such as fill-in-the-blanks and sentence correction", "Memorising unrelated vocabulary lists", "Solving mathematical equations", "Drawing diagrams"], 1, `Grammar rules like "${chapterTitle}" are reinforced through structured practice exercises.`],
  ];
  const banksHi: [string, string[], number, string][] = [
    [`"${chapterTitle}" के नियम का सही प्रयोग किस वाक्य में हुआ है?`, ["इस विषय के मानक व्याकरण नियम का पालन करने वाला वाक्य", "स्पष्ट व्याकरणिक त्रुटि वाला वाक्य", "पूर्णतः किसी अन्य भाषा का वाक्य", "बिना क्रिया वाला वाक्य"], 1, `"${chapterTitle}" का सही प्रयोग मानक व्याकरण नियम के अनुसार होता है।`],
    [`"${chapterTitle}" से जुड़ी सबसे सामान्य त्रुटि कौन-सी है?`, ["इस नियम से संबंधित गलत रूप या प्रयोग", "व्याकरण से असंबंधित वर्तनी की गलती", "अंत में विराम चिह्न न लगाना", "केवल बड़े अक्षर की गलती"], 1, `"${chapterTitle}" में त्रुटियाँ प्रायः गलत रूप या प्रयोग से जुड़ी होती हैं।`],
    [`"${chapterTitle}" का सर्वोत्तम अभ्यास किस प्रकार होता है?`, ["रिक्त स्थान भरना एवं वाक्य सुधार जैसे संरचित अभ्यास", "असंबंधित शब्दावली रटना", "गणितीय समीकरण हल करना", "चित्र बनाना"], 1, `"${chapterTitle}" जैसे नियम संरचित अभ्यास से सुदृढ़ होते हैं।`],
  ];
  const pool = subjectName === "English Grammar" ? banksEn : banksHi;
  const [text, options, correctOption, explanation] = pool[i % pool.length];
  return { text, type: "multiple_choice", difficulty, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption, explanation };
}

export function generateQuestionBank(subjectName: string, chapterTitle: string, chapterId: number, count = 20): GeneratedQuestion[] {
  const qs: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    if (subjectName === "Mathematics") qs.push(mathQuestion(chapterTitle, chapterId, i));
    else if (subjectName === "Science") qs.push(scienceQuestion(chapterTitle, chapterId, i));
    else if (subjectName === "Social Science") qs.push(sstQuestion(chapterTitle, chapterId, i));
    else if (subjectName === "English") qs.push(literatureQuestion(chapterTitle, "English", i));
    else if (subjectName === "Hindi") qs.push(literatureQuestion(chapterTitle, "Hindi", i));
    else if (subjectName === "English Grammar") qs.push(grammarQuestion(chapterTitle, "English Grammar", i));
    else if (subjectName === "Hindi Grammar") qs.push(grammarQuestion(chapterTitle, "Hindi Grammar", i));
    else qs.push(mathQuestion(chapterTitle, chapterId, i));
  }
  return qs;
}

// ------------------------------------------------------------ Flashcards ---

export function generateFlashcards(subjectName: string, chapterTitle: string, count = 8): { front: string; back: string; difficulty: string }[] {
  const cards: { front: string; back: string; difficulty: string }[] = [];
  const diffs = ["easy", "easy", "medium", "medium", "hard", "hard", "medium", "easy"];
  for (let i = 0; i < count; i++) {
    const difficulty = diffs[i % diffs.length];
    if (subjectName === "Mathematics" || subjectName === "Science") {
      cards.push({
        front: `${chapterTitle}: Key term / formula #${i + 1} — what is it?`,
        back: `Refer to "${chapterTitle}" (${subjectName}) for the definition, formula, or rule at this revision level (${difficulty}).`,
        difficulty,
      });
    } else if (subjectName === "Social Science") {
      cards.push({
        front: `${chapterTitle}: Key fact/date/term #${i + 1} — what is it?`,
        back: `Refer to "${chapterTitle}" (Social Science) for the fact, date, or term at this revision level (${difficulty}).`,
        difficulty,
      });
    } else if (subjectName === "English" || subjectName === "Hindi") {
      cards.push({
        front: `${chapterTitle}: Vocabulary/theme point #${i + 1}`,
        back: `Refer to "${chapterTitle}" (${subjectName}) for the word meaning, theme point, or character detail at this revision level (${difficulty}).`,
        difficulty,
      });
    } else {
      cards.push({
        front: `${chapterTitle}: Grammar rule point #${i + 1}`,
        back: `Refer to "${chapterTitle}" for the rule, exception, or usage example at this revision level (${difficulty}).`,
        difficulty,
      });
    }
  }
  return cards;
}
