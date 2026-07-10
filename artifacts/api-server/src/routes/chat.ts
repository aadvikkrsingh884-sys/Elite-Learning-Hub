/**
 * AI Study Buddy — Gemini-backed RAG chatbot with vision support.
 *
 * POST /chat  { chapterId, message, history?, image? }
 *
 * Retrieval: pulls the topics, question-bank Q&A, and flashcards for the
 * given chapter directly from Postgres and feeds them to Gemini as grounding
 * context, so syllabus questions are scoped to the chapter the student is
 * viewing. Questions outside that context (or with no chapter open) fall
 * back to general "expert tutor" answers instead of refusing — see
 * `buildSystemPreamble`. `image` (base64 + mimeType) lets a student attach a
 * photo of a doubt (e.g. a textbook problem) for Gemini's vision model to
 * read directly, no separate OCR step needed.
 */
import { Router, type IRouter } from "express";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { db, chaptersTable, topicsTable, questionBankTable, flashcardsTable, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const apiKey = process.env["GEMINI_API_KEY"];
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Keep in sync with the frontend's own guard in StudyBuddyChat.tsx.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB raw file, ~10.7MB once base64-encoded
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatImage {
  data: string; // base64, no data: prefix
  mimeType: string;
}

async function buildChapterContext(chapterId: number): Promise<string> {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  if (!chapter) return "";

  const [subject] = chapter.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, chapter.subjectId))
    : [];

  const topics = await db.select().from(topicsTable).where(eq(topicsTable.chapterId, chapterId)).limit(30);
  const questions = await db
    .select()
    .from(questionBankTable)
    .where(eq(questionBankTable.chapterId, chapterId))
    .limit(15);
  const flashcards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.chapterId, chapterId)).limit(15);

  const parts: string[] = [];
  parts.push(`Chapter: "${chapter.title}" (Subject: ${subject?.name ?? "Unknown"}, Class ${subject?.classLevel ?? "?"})`);
  if (chapter.description) parts.push(`Chapter overview: ${chapter.description}`);

  if (topics.length) {
    parts.push("\nTopics in this chapter:");
    for (const t of topics) parts.push(`- ${t.title}`);
  }

  if (questions.length) {
    parts.push("\nSample questions & explanations from this chapter's question bank:");
    for (const q of questions) {
      parts.push(`Q: ${q.text}`);
      if (q.explanation) parts.push(`Explanation: ${q.explanation}`);
    }
  }

  if (flashcards.length) {
    parts.push("\nKey flashcard facts for this chapter:");
    for (const f of flashcards) parts.push(`- ${f.front} => ${f.back}`);
  }

  return parts.join("\n");
}

/**
 * Builds the system preamble. The assistant always operates in one of two
 * blended modes rather than a hard switch:
 *  - Syllabus mode (a chapter is open): ground answers in that chapter's
 *    content first, but if the question strays outside it, say so briefly
 *    and still answer well as a general tutor instead of refusing.
 *  - General Tutor mode (no chapter open, or the topic is unrelated to any
 *    CBSE syllabus at all — e.g. a general-knowledge or off-syllabus
 *    question): answer as a knowledgeable, encouraging expert tutor, not
 *    limited to the CBSE curriculum.
 */
function buildSystemPreamble(context: string): string {
  const base =
    `You are AuraLearning's "AI Study Buddy", a Universal AI Study Assistant for students. ` +
    `You serve two modes and should pick whichever fits the student's question: ` +
    `(1) Syllabus mode — for CBSE curriculum questions, explain step-by-step, exam-focused and age-appropriate; ` +
    `(2) General Tutor mode — for anything outside the syllabus (other boards, general knowledge, coding, career advice, life questions, etc.), ` +
    `answer as a friendly, expert tutor with the same care and clarity, instead of refusing or saying it's out of scope. ` +
    `If a student attaches a photo of a problem, read it carefully (handwriting, diagrams, printed text) and solve or explain what's shown.`;

  if (!context) {
    return `${base}\n\nNo specific chapter is open right now, so use General Tutor mode by default unless the student's question is clearly CBSE-syllabus related.`;
  }

  return (
    `${base}\n\nA chapter is currently open — prefer Syllabus mode and answer strictly using the chapter context below when it is relevant. ` +
    `If the question falls outside this chapter's context, briefly say so, then switch to General Tutor mode and still give a complete, helpful answer.` +
    `\n\n--- CHAPTER CONTEXT ---\n${context}\n--- END CONTEXT ---\n`
  );
}

router.post("/chat", async (req, res): Promise<void> => {
  try {
    if (!genAI) {
      res.status(503).json({
        error: "AI Study Buddy is not configured. Missing GEMINI_API_KEY.",
      });
      return;
    }

    const { chapterId, message, history, image } = req.body as {
      chapterId?: number;
      message?: string;
      history?: ChatMessage[];
      image?: ChatImage;
    };

    const hasImage = image && typeof image.data === "string" && typeof image.mimeType === "string";

    if ((!message || typeof message !== "string" || !message.trim()) && !hasImage) {
      res.status(400).json({ error: "message or image is required" });
      return;
    }

    if (hasImage) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(image.mimeType)) {
        res.status(400).json({ error: `Unsupported image type: ${image.mimeType}` });
        return;
      }
      // base64 is ~4/3 the size of the raw bytes.
      const approxBytes = Math.ceil((image.data.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        res.status(413).json({ error: "Image is too large (max 8MB)." });
        return;
      }
    }

    let context = "";
    if (typeof chapterId === "number" && Number.isFinite(chapterId)) {
      context = await buildChapterContext(chapterId);
    }

    const systemPreamble = buildSystemPreamble(context);

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const chatHistory = (history ?? []).slice(-8).map((h) => ({
      role: h.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPreamble }] },
        { role: "model", parts: [{ text: "Understood — I'll switch between syllabus grounding and general tutoring as needed." }] },
        ...chatHistory,
      ],
    });

    const messageParts: Part[] = [];
    const text = (message ?? "").trim();
    if (text) messageParts.push({ text });
    if (hasImage) {
      if (!text) messageParts.push({ text: "Please look at this photo and help me with it." });
      messageParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    // Gemini occasionally hangs or the connection drops under load; fail fast with one retry
    // instead of leaving the student staring at a spinner for 60-120s.
    const reply = await sendWithRetry(chat, messageParts);

    res.json({ reply, grounded: Boolean(context) });
  } catch (err) {
    console.error("[chat] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      res.status(429).json({
        error: "AI Study Buddy is temporarily out of quota on the connected Gemini API key. Please try again shortly or check the key's billing/plan.",
      });
      return;
    }
    if (message === "gemini_timeout" || message.toLowerCase().includes("fetch failed")) {
      res.status(503).json({
        error: "AI Study Buddy couldn't reach Gemini in time. Please try again in a moment.",
      });
      return;
    }
    res.status(500).json({ error: "AI Study Buddy failed to respond" });
  }
});

const GEMINI_TIMEOUT_MS = 25_000;

/**
 * Sends a message with a hard timeout (Gemini can otherwise hang well past a
 * minute under load) and one retry on timeout/network failure, so a single
 * transient blip doesn't turn into a 2-minute hang for the student.
 */
async function sendWithRetry(
  chat: ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["startChat"]>,
  parts: Part[],
  attempt = 1,
): Promise<string> {
  try {
    const result = await Promise.race([
      chat.sendMessage(parts),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("gemini_timeout")), GEMINI_TIMEOUT_MS)),
    ]);
    return result.response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const retryable = message === "gemini_timeout" || message.toLowerCase().includes("fetch failed");
    if (retryable && attempt < 2) {
      return sendWithRetry(chat, parts, attempt + 1);
    }
    throw err;
  }
}

export default router;
