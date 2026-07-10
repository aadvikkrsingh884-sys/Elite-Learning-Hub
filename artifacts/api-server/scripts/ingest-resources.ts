/**
 * Phase 4 pilot ingestion: generates a real PDF for each not-yet-filed
 * study_resources row belonging to a pilot set of subjects, uploads it to
 * Replit Object Storage, and writes the resulting public URL back to
 * `file_url` so the download route redirects straight to the stored file
 * instead of generating on the fly.
 *
 * Usage: pnpm --filter @workspace/api-server exec tsx scripts/ingest-resources.ts [subjectId ...]
 * With no args, ingests the first 3 subjects (by id) as a pilot batch.
 */
import { db, studyResourcesTable, chaptersTable, subjectsTable } from "@workspace/db";
import { eq, inArray, isNull } from "drizzle-orm";
import { renderProfessionalPdf } from "../src/routes/resources";
import { isObjectStorageConfigured, uploadBufferToPublicStorage } from "../src/lib/resourceStorage";

async function main() {
  if (!isObjectStorageConfigured()) {
    console.error("Object storage is not configured — run setupObjectStorage() first.");
    process.exit(1);
  }

  const argIds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
  const subjects = argIds.length
    ? await db.select().from(subjectsTable).where(inArray(subjectsTable.id, argIds))
    : (await db.select().from(subjectsTable)).slice(0, 3);

  if (subjects.length === 0) {
    console.error("No subjects found to ingest.");
    process.exit(1);
  }

  console.log(`Pilot ingestion for subjects: ${subjects.map((s) => `${s.id}:${s.name}`).join(", ")}`);

  let uploaded = 0;
  let failed = 0;

  for (const subject of subjects) {
    const rows = await db
      .select()
      .from(studyResourcesTable)
      .where(eq(studyResourcesTable.subjectId, subject.id));

    const pending = rows.filter((r) => !r.fileUrl);
    console.log(`Subject "${subject.name}": ${pending.length}/${rows.length} resources need a real file.`);

    for (const r of pending) {
      try {
        let chapterTitle = "Chapter";
        if (r.chapterId) {
          const [ch] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, r.chapterId));
          if (ch) chapterTitle = ch.title;
        }

        const pdfBuffer = await renderProfessionalPdf({
          title: r.title,
          resourceType: r.resourceType,
          chapterTitle,
          subjectName: subject.name,
          classId: r.classId,
        });

        const safeTitle = r.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        const destination = `resources/class-${r.classId}/subject-${subject.id}/chapter-${r.chapterId ?? "na"}/${r.id}-${safeTitle}.pdf`;

        const { storageUrl } = await uploadBufferToPublicStorage({ buffer: pdfBuffer, destination, contentType: "application/pdf" });
        await db.update(studyResourcesTable).set({ fileUrl: storageUrl }).where(eq(studyResourcesTable.id, r.id));

        uploaded++;
        if (uploaded % 25 === 0) console.log(`  ...${uploaded} uploaded so far`);
      } catch (err) {
        failed++;
        console.error(`  Failed resource ${r.id} ("${r.title}"):`, err instanceof Error ? err.message : err);
      }
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}, Failed: ${failed}.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Ingestion script crashed:", err);
  process.exit(1);
});
