---
name: AuraLearning DB seed
description: What CBSE content is seeded into the Replit PostgreSQL database for AuraLearning Elite.
---

## Subjects
- 27 subjects: 5 core (Math, Science, Social Science, English, Hindi) × Classes 6–10 = 25, plus
  English Grammar and Hindi Grammar as 2 global subjects at `classLevel: 0` (shared across all classes).

## Chapters
- 385 chapters across all classes/subjects, sourced from a user-supplied curriculum PDF for the
  2026-27 syllabus (see `lib/db/src/curriculum.ts` header comment for the exact documented gaps
  filled from the standard NCERT sequence: Class 6 Math/Science, part of Class 6 SST, Class 10
  Math ch.1-3, and both Grammar subjects were not in the PDF and are supplemented).
- Chapter identity during seeding must be keyed by `(classLevel, subjectName, title)`, not title
  alone — the same chapter title recurs across classes (e.g. "Acids, Bases and Salts" in both
  Class 7 and Class 10 Science).

## Topics
- Every chapter gets 4 subject-template-generated topics (~1540 total): Math/Science/SST/English/
  Hindi/Grammar each have their own topic-label template in `seed.ts` (`TOPIC_TEMPLATES`).

## Tests / Important Questions / Demo student
- 14 tests, 45 MCQ questions, 23 important questions across classes 6-10, referencing real chapter
  titles (chapterName is free text, not FK-checked). Demo student: demo@auralearning.com / class 8.

## Reseeding after import / fresh DB
- On a fresh/empty Postgres (e.g. project re-imported from GitHub), tables exist only after
  `pnpm --filter @workspace/db run push`; seed data does not travel with the code.
- Seed script (`lib/db/src/seed.ts`) is idempotent: it TRUNCATEs all seedable tables inside one
  transaction, then reinserts — safe to re-run, never accumulates duplicates or fails on unique
  constraints.
- Order after import: `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/db run seed`.

## Curriculum source of truth
- When a user supplies an authoritative curriculum PDF, prefer `pdftotext -raw` over `-layout` for
  Hindi/Devanagari text — `-layout` mode badly mangles conjunct characters (e.g. splits "मातृभूमि"
  across lines with broken glyphs); `-raw` preserves correct conjuncts.
- `classLevel` API filters must use `!== undefined` (not truthiness) when 0 is a valid, meaningful
  value — `subjects.ts`'s `classLevel ? ... : ...` silently ignored `classLevel=0` and returned all
  subjects instead of just the global Grammar ones. Check this pattern elsewhere if similar bugs surface.
