import jsPDF from "jspdf";

const BASE_URL = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

interface TopicReport {
  id: number;
  title: string;
  isImportant: boolean;
  status: "complete" | "in_progress" | "not_started" | string;
}

interface ChapterReport {
  id: number;
  number: number;
  title: string;
  topics: TopicReport[];
  completedTopics: number;
  totalTopics: number;
  mastery: number;
}

interface SubjectReport {
  id: number;
  name: string;
  color: string;
  icon: string;
  totalChapters: number;
  totalTopics: number;
  completedTopics: number;
  mastery: number;
  chapters: ChapterReport[];
}

interface ReportData {
  student: { id: number; name: string; email: string; classLevel: number };
  classLevel: number;
  generatedAt: string;
  subjects: SubjectReport[];
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function statusIcon(status: string): string {
  if (status === "complete") return "✓";
  if (status === "in_progress") return "◐";
  return "○";
}

function statusColor(status: string): [number, number, number] {
  if (status === "complete") return [22, 163, 74];    // green-600
  if (status === "in_progress") return [37, 99, 235]; // blue-600
  return [156, 163, 175];                              // gray-400
}

// ── PDF builder ───────────────────────────────────────────────────────────────

export async function generateProgressReport(token?: string): Promise<void> {
  // 1. Fetch report data
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/progress/report`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);
  const data: ReportData = await res.json();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;   // A4 width
  const MARGIN = 14;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function checkPageBreak(needed: number) {
    if (y + needed > 277) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function drawProgressBar(x: number, barY: number, w: number, h: number, pct: number, color: [number, number, number]) {
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(x, barY, w, h, h / 2, h / 2, "FD");
    if (pct > 0) {
      doc.setDrawColor(...color);
      doc.setFillColor(...color);
      doc.roundedRect(x, barY, Math.max(h, (pct / 100) * w), h, h / 2, h / 2, "FD");
    }
  }

  // ── Header ───────────────────────────────────────────────────────────────

  // Gradient simulation via three overlapping rectangles (indigo shades)
  doc.setFillColor(49, 46, 129);   // indigo-900
  doc.rect(0, 0, W, 40, "F");
  doc.setFillColor(67, 56, 202);   // indigo-700, subtle right glow
  doc.rect(W * 0.55, 0, W * 0.45, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AuraLearning Elite", MARGIN, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Comprehensive Progress Report", MARGIN, 23);

  // Student info box (right side of header)
  const generated = new Date(data.generatedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`Student: ${data.student.name}`, W - MARGIN, 13, { align: "right" });
  doc.text(`Class: ${data.classLevel}   |   Generated: ${generated}`, W - MARGIN, 20, { align: "right" });

  y = 46;

  // ── Overall summary row ──────────────────────────────────────────────────

  const totalTopics = data.subjects.reduce((s, sub) => s + sub.totalTopics, 0);
  const completedTopics = data.subjects.reduce((s, sub) => s + sub.completedTopics, 0);
  const overallMastery = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const PILL_W = (CONTENT_W - 6) / 3;
  const pills = [
    { label: "Overall Mastery", value: `${overallMastery}%`, color: [67, 56, 202] as [number, number, number] },
    { label: "Topics Completed", value: `${completedTopics} / ${totalTopics}`, color: [22, 163, 74] as [number, number, number] },
    { label: "Subjects Covered", value: `${data.subjects.length}`, color: [217, 119, 6] as [number, number, number] },
  ];

  for (let i = 0; i < pills.length; i++) {
    const px = MARGIN + i * (PILL_W + 3);
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(px, y, PILL_W, 16, 2, 2, "F");
    doc.setTextColor(...pills[i].color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(pills[i].value, px + PILL_W / 2, y + 8, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 120);
    doc.text(pills[i].label, px + PILL_W / 2, y + 13, { align: "center" });
  }

  y += 22;

  // ── Per-subject sections ─────────────────────────────────────────────────

  for (const subj of data.subjects) {
    checkPageBreak(30);

    const subjColor = hexToRgb(subj.color || "#4f46e5");

    // Subject heading strip
    doc.setFillColor(...subjColor);
    doc.roundedRect(MARGIN, y, CONTENT_W, 11, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(subj.name, MARGIN + 4, y + 7.5);

    // Mastery badge (right side)
    const badgeText = `${subj.mastery}% mastery  |  ${subj.completedTopics}/${subj.totalTopics} topics`;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(badgeText, W - MARGIN - 2, y + 7.5, { align: "right" });

    y += 14;

    // Subject progress bar
    drawProgressBar(MARGIN, y, CONTENT_W, 3, subj.mastery, subjColor);
    y += 7;

    // ── Chapters ──────────────────────────────────────────────────────────

    for (const ch of subj.chapters) {
      checkPageBreak(20);

      // Chapter header row
      doc.setFillColor(245, 247, 255);
      doc.rect(MARGIN, y, CONTENT_W, 8, "F");
      doc.setTextColor(30, 30, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`Ch ${ch.number}: ${ch.title}`, MARGIN + 3, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const chStatus = `${ch.completedTopics}/${ch.totalTopics}  ${ch.mastery}%`;
      doc.text(chStatus, W - MARGIN - 2, y + 5.5, { align: "right" });

      // thin chapter bar
      drawProgressBar(MARGIN, y + 9, CONTENT_W, 2, ch.mastery, subjColor);
      y += 13;

      // ── Topics ──────────────────────────────────────────────────────────
      // Single-column layout with dynamic row height so no title is truncated.

      const TOPIC_MAX_W = CONTENT_W - 12; // left: 6mm indent + icon; right: margin
      const LINE_H = 4.5; // mm per line of topic text at 7pt
      const ICON_INDENT = 5.5;

      for (const t of ch.topics) {
        doc.setFont("helvetica", t.isImportant ? "bold" : "normal");
        doc.setFontSize(7);
        const lines: string[] = doc.splitTextToSize(t.title, TOPIC_MAX_W - ICON_INDENT);
        const rowH = Math.max(6, lines.length * LINE_H + 1.5);

        checkPageBreak(rowH);

        const [r, g, b] = statusColor(t.status);
        const icon = statusIcon(t.status);

        // Status icon circle
        doc.setFillColor(r, g, b);
        doc.circle(MARGIN + 2, y + 2.5, 1.8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.setFont("helvetica", "bold");
        doc.text(icon, MARGIN + 2, y + 3.3, { align: "center" });

        // Topic title (all wrapped lines)
        doc.setTextColor(40, 40, 60);
        doc.setFont("helvetica", t.isImportant ? "bold" : "normal");
        doc.setFontSize(7);
        for (let li = 0; li < lines.length; li++) {
          doc.text(lines[li], MARGIN + ICON_INDENT, y + 3.2 + li * LINE_H);
        }

        // Important star after the last line of the title
        if (t.isImportant) {
          const lastLine = lines[lines.length - 1];
          doc.setTextColor(217, 119, 6);
          doc.setFontSize(6);
          doc.text("★", MARGIN + ICON_INDENT + doc.getTextWidth(lastLine) + 1,
            y + 3.2 + (lines.length - 1) * LINE_H);
        }

        y += rowH;
      }

      y += 3; // gap after chapter
    }

    y += 5; // gap after subject
  }

  // ── Legend & footer ──────────────────────────────────────────────────────

  checkPageBreak(18);
  y += 2;

  doc.setDrawColor(200, 200, 220);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 100);
  doc.text("Legend:", MARGIN, y);
  const legendItems = [
    { icon: "✓", color: [22, 163, 74] as [number, number, number], label: "Complete" },
    { icon: "◐", color: [37, 99, 235] as [number, number, number], label: "In Progress" },
    { icon: "○", color: [156, 163, 175] as [number, number, number], label: "Not Started" },
    { icon: "★", color: [217, 119, 6] as [number, number, number], label: "Important Topic" },
  ];
  let lx = MARGIN + 18;
  for (const li of legendItems) {
    doc.setFillColor(...li.color);
    doc.circle(lx, y - 0.8, 1.8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text(li.icon, lx, y - 0.1, { align: "center" });
    doc.setTextColor(80, 80, 100);
    doc.setFontSize(7);
    doc.text(li.label, lx + 3, y);
    lx += doc.getTextWidth(li.label) + 10;
  }

  y += 6;

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 160);
    doc.setFont("helvetica", "normal");
    doc.text(
      `AuraLearning Elite — Progress Report — Page ${i} of ${pageCount}`,
      W / 2, 292,
      { align: "center" }
    );
  }

  // ── Download ─────────────────────────────────────────────────────────────

  const safeName = data.student.name.replace(/\s+/g, "_");
  doc.save(`AuraLearning_Progress_${safeName}_Class${data.classLevel}.pdf`);
}
