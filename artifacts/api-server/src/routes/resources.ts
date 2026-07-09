/**
 * Study Resources API
 *
 * GET  /resources?chapterId=&subjectId=&classId=  — list resources (filtered)
 * GET  /resources/:id/download                    — stream a generated PDF
 */
import { Router, type IRouter } from "express";
import { db, studyResourcesTable, chaptersTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function parseIntParam(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? undefined : n;
}

// ── List resources ────────────────────────────────────────────────────────────
router.get("/resources", async (req, res): Promise<void> => {
  try {
    const chapterId = parseIntParam(req.query.chapterId);
    const subjectId = parseIntParam(req.query.subjectId);
    const classId   = parseIntParam(req.query.classId);

    const conditions = [];
    if (chapterId !== undefined) conditions.push(eq(studyResourcesTable.chapterId, chapterId));
    if (subjectId !== undefined) conditions.push(eq(studyResourcesTable.subjectId, subjectId));
    if (classId !== undefined)   conditions.push(eq(studyResourcesTable.classId, classId));

    const rows = conditions.length
      ? await db.select().from(studyResourcesTable).where(and(...conditions))
      : await db.select().from(studyResourcesTable).limit(200);

    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      resourceType: r.resourceType,
      classId: r.classId,
      subjectId: r.subjectId,
      chapterId: r.chapterId,
      fileUrl: r.fileUrl,
      description: r.description,
    })));
  } catch (err) {
    console.error("[resources] list error:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// ── Download / generate PDF ───────────────────────────────────────────────────
router.get("/resources/:id/download", async (req, res): Promise<void> => {
  try {
    const resourceId = parseIntParam(req.params.id);

    // Negative IDs are front-end placeholders (no real DB row) — still serve a PDF.
    let title = "Study Resource";
    let resourceType = "RevisionNote";
    let chapterTitle = "Chapter";
    let subjectName = "Subject";
    let classId = 8;

    if (resourceId !== undefined && resourceId > 0) {
      const rows = await db.select().from(studyResourcesTable).where(eq(studyResourcesTable.id, resourceId));
      if (rows.length === 0) { res.status(404).json({ error: "Resource not found" }); return; }
      const r = rows[0];
      // If a real file URL is stored, redirect to it
      if (r.fileUrl) { res.redirect(r.fileUrl); return; }
      title = r.title;
      resourceType = r.resourceType;
      classId = r.classId;
      if (r.chapterId) {
        const ch = await db.select().from(chaptersTable).where(eq(chaptersTable.id, r.chapterId));
        if (ch.length) chapterTitle = ch[0].title;
      }
      if (r.subjectId) {
        const sb = await db.select().from(subjectsTable).where(eq(subjectsTable.id, r.subjectId));
        if (sb.length) subjectName = sb[0].name;
      }
    } else {
      // Placeholder IDs from the frontend graceful fallback — just generate a generic PDF
      title = req.query.title ? String(req.query.title) : "Study Resource";
    }

    // Generate a simple PDF in-memory using raw PDF syntax (no extra dependency required).
    // Format: minimal valid PDF with one text page.
    const lines = buildPdfLines({ title, resourceType, chapterTitle, subjectName, classId });
    const pdfBuffer = Buffer.from(lines, "latin1");

    const safeFilename = title.replace(/[^a-z0-9\s_-]/gi, "").replace(/\s+/g, "_").slice(0, 60) || "resource";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[resources] download error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// ── Minimal valid PDF builder ─────────────────────────────────────────────────
// Produces a human-readable, structurally valid single-page PDF.
function buildPdfLines(opts: {
  title: string; resourceType: string; chapterTitle: string; subjectName: string; classId: number;
}): string {
  const { title, resourceType, chapterTitle, subjectName, classId } = opts;
  const TYPE_LABELS: Record<string, string> = {
    PYQ: "Previous Year Question Paper",
    TopperNote: "Topper's Handwritten Notes",
    VIPNote: "VIP Teacher Notes",
    CheatSheet: "Quick-Reference Cheat Sheet",
    SamplePaper: "Sample Examination Paper",
    RevisionNote: "Rapid Revision Notes",
  };
  const typeLabel = TYPE_LABELS[resourceType] ?? resourceType;

  // Encode text for PDF stream.
  // PDF Type1/Helvetica uses Latin-1 (ISO-8859-1); Devanagari and other non-Latin
  // scripts must be transliterated/stripped to avoid mojibake in the generated file.
  function toLatinSafe(s: string): string {
    // Replace common Devanagari chapter-title patterns with ASCII equivalents.
    return s
      .replace(/[\u0900-\u097F\u1CD0-\u1CFF]+/g, "[Hindi]") // Devanagari block
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");               // any other non-Latin-1
  }
  function esc(s: string) {
    return toLatinSafe(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  const lines = [
    `BT`,
    `/F1 22 Tf`,
    `50 760 Td`,
    `(${esc("AuraLearning Elite")}) Tj`,
    `0 -30 Td`,
    `/F1 14 Tf`,
    `(${esc(title)}) Tj`,
    `0 -24 Td`,
    `/F1 11 Tf`,
    `(${esc(`Type: ${typeLabel}`)}) Tj`,
    `0 -18 Td`,
    `(${esc(`Subject: ${subjectName}  |  Chapter: ${chapterTitle}  |  Class ${classId}`)}) Tj`,
    `0 -18 Td`,
    `(${esc("2026-27 CBSE Curriculum — Generated by AuraLearning Engine")}) Tj`,
    `0 -40 Td`,
    `/F1 10 Tf`,
    `(${esc("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}) Tj`,
    `0 -20 Td`,
    `(${esc(`This document is a placeholder for the "${typeLabel}"`)}) Tj`,
    `0 -16 Td`,
    `(${esc(`resource belonging to the chapter "${chapterTitle}"`)}) Tj`,
    `0 -16 Td`,
    `(${esc("in the AuraLearning Elite study platform.")}) Tj`,
    `0 -30 Td`,
    `/F1 11 Tf`,
    `(${esc("In the production release, this PDF will contain:")}) Tj`,
    `0 -18 Td`,
    `/F1 10 Tf`,
    ...generateBullets(resourceType, chapterTitle).map((b, i) =>
      i === 0 ? `(${esc(b)}) Tj` : `0 -16 Td\n(${esc(b)}) Tj`
    ),
    `0 -40 Td`,
    `/F1 9 Tf`,
    `(${esc("AuraLearning Elite  |  CBSE Classes 6-10  |  2026-27")}) Tj`,
    `ET`,
  ].join("\n");

  // Build a syntactically correct minimal PDF
  const stream = lines;
  const streamBytes = Buffer.byteLength(stream, "latin1");

  let pdf = "%PDF-1.4\n";
  const obj1offset = pdf.length;
  pdf += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2offset = pdf.length;
  pdf += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3offset = pdf.length;
  pdf += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4offset = pdf.length;
  pdf += `4 0 obj\n<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream\nendobj\n`;
  const obj5offset = pdf.length;
  pdf += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const xrefOffset = pdf.length;
  const offsets = [0, obj1offset, obj2offset, obj3offset, obj4offset, obj5offset];
  pdf += `xref\n0 6\n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, "0")} 00000 ${o === 0 ? "f" : "n"} \n`;
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
}

function generateBullets(resourceType: string, chapterTitle: string): string[] {
  const map: Record<string, string[]> = {
    PYQ: [
      `  • Board exam questions (2019–2025) for "${chapterTitle}"`,
      "  • Marking scheme and model answers",
      "  • Question frequency analysis (what appears most often)",
      "  • Examiner tips and common student mistakes",
    ],
    TopperNote: [
      `  • Concise chapter summary of "${chapterTitle}"`,
      "  • Key diagrams and mnemonics used by top scorers",
      "  • Highlighted formulas and must-remember facts",
      "  • Last-minute revision tips from 95%+ students",
    ],
    VIPNote: [
      `  • Expert teacher explanation of "${chapterTitle}"`,
      "  • Step-by-step solved examples with reasoning",
      "  • Shortcut methods and smart problem-solving strategies",
      "  • Common exam traps and how to avoid them",
    ],
    CheatSheet: [
      `  • All formulas and definitions for "${chapterTitle}" on one page`,
      "  • Colour-coded categories for fast recall",
      "  • Quick reference table for MCQ-type questions",
      "  • Print-ready A4 format",
    ],
    SamplePaper: [
      `  • Full 80-mark sample paper covering "${chapterTitle}"`,
      "  • Section-wise (MCQ / Short / Long) with marks distribution",
      "  • Detailed answer key with step-by-step solutions",
      "  • Designed to mirror actual CBSE board paper format",
    ],
    RevisionNote: [
      `  • One-page rapid-revision summary of "${chapterTitle}"`,
      "  • Bullet-point key facts, dates, and definitions",
      "  • Diagrams reduced to essential labels only",
      "  • Ideal for revision 24 hours before the exam",
    ],
  };
  return map[resourceType] ?? [
    `  • Comprehensive notes for "${chapterTitle}"`,
    "  • Exam-focused content prepared by subject experts",
    "  • Aligned with 2026-27 CBSE syllabus",
  ];
}

export default router;
