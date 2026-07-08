---
name: AuraLearning DB seed
description: What CBSE content is seeded into the Replit PostgreSQL database for AuraLearning Elite.
---

## Subjects
- 25 subjects: 5 per class (Math, Science, SST, English, Hindi) × Classes 6–10.
- IDs 1–5 are Class 8 subjects (Math=1, Science=2, SST=3, English=4, Hindi=5).

## Chapters
- 55 chapters total seeded for Class 8 subjects (14 Math, 15 Science, 10 SST, 8 English, 8 Hindi).

## Topics
- 63 topics seeded for key Class 8 chapters.

## Tests
- 14 tests seeded across classes 6–10 with difficulty levels.

## Questions
- 45 MCQ questions seeded (20 for Rational Numbers test, 20 for Algebra test, 5 for Force & Pressure).

## Important Questions
- 23 high-quality important questions seeded across Math/Science/SST/English for classes 8–10.

## Demo student
- ID: 1, email: demo@auralearning.com, class 8, 2450 points.

**Why:** Schema push was done before seeding; run `pnpm --filter @workspace/db run push` again if schema changes.

## Reseeding after import / fresh DB
- On a fresh/empty Postgres (e.g. project re-imported from GitHub), tables exist only after `pnpm --filter @workspace/db run push`; seed data does not travel with the code.
- Seed script (`lib/db/src/seed.ts`) is idempotent: it TRUNCATEs all seedable tables inside one transaction, then reinserts — safe to re-run, never accumulates duplicates or fails on unique constraints.
- Order after import: `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/db run seed`.
