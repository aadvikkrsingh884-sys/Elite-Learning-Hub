/**
 * Study Resources API
 *
 * GET  /resources?chapterId=&subjectId=&classId=&page=&pageSize=  — paginated list
 * GET  /resources/:id/download                                   — real file (Firebase) or generated PDF
 */
import { Router, type IRouter } from "express";
import { db, studyResourcesTable, chaptersTable, subjectsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import PDFDocument from "pdfkit";

const router: IRouter = Router();

function parseIntParam(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? undefined : n;
}

// ── List resources (paginated) ─────────────────────────────────────────────────
router.get("/resources", async (req, res): Promise<void> => {
  try {
    const chapterId = parseIntParam(req.query.chapterId);
    const subjectId = parseIntParam(req.query.subjectId);
    const classId = parseIntParam(req.query.classId);

    // Pagination — default page size kept small so the resource hub stays fast
    // even once thousands of files are ingested.
    const page = Math.max(1, parseIntParam(req.query.page) ?? 1);
    const pageSize = Math.min(100, Math.max(1, parseIntParam(req.query.pageSize) ?? 24));

    const conditions = [];
    if (chapterId !== undefined) conditions.push(eq(studyResourcesTable.chapterId, chapterId));
    if (subjectId !== undefined) conditions.push(eq(studyResourcesTable.subjectId, subjectId));
    if (classId !== undefined) conditions.push(eq(studyResourcesTable.classId, classId));
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const totalQuery = whereClause
      ? db.select({ value: count() }).from(studyResourcesTable).where(whereClause)
      : db.select({ value: count() }).from(studyResourcesTable);
    const [{ value: total }] = await totalQuery;

    const rowsQuery = whereClause
      ? db.select().from(studyResourcesTable).where(whereClause)
      : db.select().from(studyResourcesTable);
    const rows = await rowsQuery.limit(pageSize).offset((page - 1) * pageSize);

    res.json({
      items: rows.map((r: typeof studyResourcesTable.$inferSelect) => ({
        id: r.id,
        title: r.title,
        resourceType: r.resourceType,
        classId: r.classId,
        subjectId: r.subjectId,
        chapterId: r.chapterId,
        fileUrl: r.fileUrl,
        description: r.description,
      })),
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    console.error("[resources] list error:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// ── Download / generate PDF ───────────────────────────────────────────────────
router.get("/resources/:id/download", async (req, res): Promise<void> => {
  try {
    const resourceId = parseIntParam(req.params.id);

    let title = "Study Resource";
    let resourceType = "RevisionNote";
    let chapterTitle = "Chapter";
    let subjectName = "Subject";
    let classId = 8;

    if (resourceId !== undefined && resourceId > 0) {
      const rows = await db.select().from(studyResourcesTable).where(eq(studyResourcesTable.id, resourceId));
      if (rows.length === 0) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      const r = rows[0];
      // A real file (Firebase Storage public URL) takes priority over generation.
      if (r.fileUrl) {
        res.redirect(r.fileUrl);
        return;
      }
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
      title = req.query.title ? String(req.query.title) : "Study Resource";
    }

    const pdfBuffer = await renderProfessionalPdf({ title, resourceType, chapterTitle, subjectName, classId });

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

const TYPE_LABELS: Record<string, string> = {
  PYQ: "Previous Year Question Paper",
  TopperNote: "Topper's Handwritten Notes",
  VIPNote: "VIP Teacher Notes",
  CheatSheet: "Quick-Reference Cheat Sheet",
  SamplePaper: "Sample Examination Paper",
  RevisionNote: "Rapid Revision Notes",
};

const TYPE_ACCENT: Record<string, string> = {
  PYQ: "#2563eb",
  TopperNote: "#7c3aed",
  VIPNote: "#dc2626",
  CheatSheet: "#059669",
  SamplePaper: "#d97706",
  RevisionNote: "#0891b2",
};

function generateBullets(resourceType: string, chapterTitle: string): string[] {
  const map: Record<string, string[]> = {
    PYQ: [
      `Board exam questions (2019-2025) for "${chapterTitle}"`,
      "Marking scheme and model answers",
      "Question frequency analysis (what appears most often)",
      "Examiner tips and common student mistakes",
    ],
    TopperNote: [
      `Concise chapter summary of "${chapterTitle}"`,
      "Key diagrams and mnemonics used by top scorers",
      "Highlighted formulas and must-remember facts",
      "Last-minute revision tips from 95%+ students",
    ],
    VIPNote: [
      `Expert teacher explanation of "${chapterTitle}"`,
      "Step-by-step solved examples with reasoning",
      "Shortcut methods and smart problem-solving strategies",
      "Common exam traps and how to avoid them",
    ],
    CheatSheet: [
      `All formulas and definitions for "${chapterTitle}" on one page`,
      "Colour-coded categories for fast recall",
      "Quick reference table for MCQ-type questions",
      "Print-ready A4 format",
    ],
    SamplePaper: [
      `Full 80-mark sample paper covering "${chapterTitle}"`,
      "Section-wise (MCQ / Short / Long) with marks distribution",
      "Detailed answer key with step-by-step solutions",
      "Designed to mirror actual CBSE board paper format",
    ],
    RevisionNote: [
      `One-page rapid-revision summary of "${chapterTitle}"`,
      "Bullet-point key facts, dates, and definitions",
      "Diagrams reduced to essential labels only",
      "Ideal for revision 24 hours before the exam",
    ],
  };
  return (
    map[resourceType] ?? [
      `Comprehensive notes for "${chapterTitle}"`,
      "Exam-focused content prepared by subject experts",
      "Aligned with 2026-27 CBSE syllabus",
    ]
  );
}

/**
 * Renders a full, professionally formatted A4 PDF using pdfkit: branded header
 * band, document metadata block, section rule, bulleted body content, page
 * numbering, and a footer — replacing the earlier raw-PDF-syntax generator
 * which produced a single cramped page with no real layout.
 */
export function renderProfessionalPdf(opts: {
  title: string;
  resourceType: string;
  chapterTitle: string;
  subjectName: string;
  classId: number;
}): Promise<Buffer> {
  const { title, resourceType, chapterTitle, subjectName, classId } = opts;
  const typeLabel = TYPE_LABELS[resourceType] ?? resourceType;
  const accent = TYPE_ACCENT[resourceType] ?? "#2563eb";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;

    // ── Header band ──
    doc.rect(0, 0, pageWidth, 96).fill(accent);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("AuraLearning Elite", 56, 30);
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(typeLabel.toUpperCase(), 56, 58, { characterSpacing: 0.5 });

    doc.moveDown(4);
    doc.fillColor("#111111");
    doc.y = 130;

    // ── Title ──
    doc.font("Helvetica-Bold").fontSize(22).text(title, { align: "left" });
    doc.moveDown(0.4);

    // ── Metadata block ──
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444444")
      .text(`Subject: ${subjectName}   |   Chapter: ${chapterTitle}   |   Class ${classId}`);
    doc.fillColor("#888888").fontSize(9).text("2026-27 CBSE Curriculum  •  Generated by AuraLearning Engine");
    doc.moveDown(1);

    // ── Rule ──
    doc
      .moveTo(56, doc.y)
      .lineTo(pageWidth - 56, doc.y)
      .lineWidth(1.5)
      .strokeColor(accent)
      .stroke();
    doc.moveDown(1.2);

    // ── Body ──
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#111111")
      .text("What this document covers");
    doc.moveDown(0.6);

    for (const bullet of generateBullets(resourceType, chapterTitle)) {
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(accent)
        .text("•  ", { continued: true })
        .font("Helvetica")
        .fillColor("#222222")
        .text(bullet);
      doc.moveDown(0.4);
    }

    doc.moveDown(1);
    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor("#666666")
      .text(
        "Full content for this resource is being ingested into the AuraLearning content library. " +
          "Once available, this page is replaced by the real sourced document served directly from storage.",
        { align: "left" },
      );

    // ── Footer on every buffered page ──
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.height - 40;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#999999")
        .text("AuraLearning Elite  |  CBSE Classes 6-10  |  2026-27", 56, bottom, { width: pageWidth - 112, align: "left" })
        .text(`Page ${i - range.start + 1} of ${range.count}`, 56, bottom, { width: pageWidth - 112, align: "right" });
    }

    doc.end();
  });
}

export default router;
