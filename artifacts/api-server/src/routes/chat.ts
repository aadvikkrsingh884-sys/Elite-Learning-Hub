/**
 * AI Study Buddy — Firebase/Gemini-backed RAG chatbot.
 *
 * POST /chat  { chapterId, message, history? }
 *
 * Retrieval: pulls the topics, question-bank Q&A, and flashcards for the
 * given chapter directly from Postgres and feeds them to Gemini as grounding
 * context, so answers are scoped to the chapter the student is viewing
 * instead of the model's general knowledge.
 */
import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, chaptersTable, topicsTable, questionBankTable, flashcardsTable, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const apiKey = process.env["GEMINI_API_KEY"];
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

router.post("/chat", async (req, res): Promise<void> => {
  try {
    if (!genAI) {
      res.status(503).json({
        error: "AI Study Buddy is not configured. Missing GEMINI_API_KEY.",
      });
      return;
    }

    const { chapterId, message, history } = req.body as {
      chapterId?: number;
      message?: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    let context = "";
    if (typeof chapterId === "number" && Number.isFinite(chapterId)) {
      context = await buildChapterContext(chapterId);
    }

    const systemPreamble = context
      ? `You are AuraLearning's "AI Study Buddy" for a CBSE student. Answer strictly using the chapter context below when it is relevant. ` +
        `Explain step-by-step, keep it exam-focused and age-appropriate, and if the question falls outside this chapter's context, say so and answer briefly ` +
        `from general CBSE knowledge instead of refusing.\n\n--- CHAPTER CONTEXT ---\n${context}\n--- END CONTEXT ---\n`
      : `You are AuraLearning's "AI Study Buddy" for a CBSE student (Classes 6-10). No specific chapter is open right now, so answer generally but keep it exam-focused and age-appropriate.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chatHistory = (history ?? []).slice(-8).map((h) => ({
      role: h.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPreamble }] },
        { role: "model", parts: [{ text: "Understood — I'll ground my answers in that chapter's material." }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

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
    res.status(500).json({ error: "AI Study Buddy failed to respond" });
  }
});

export default router;
