# AuraLearning Elite

A premium CBSE study companion (Classes 6–10) with subject/chapter/topic browsing, practice tests, important questions, bookmarks, and a points/reward system.

## Run & Operate

- Workflows (auto-start on Run): `web` (aura-learning frontend), `API Server` (Express backend), `Component Preview Server` (mockup sandbox for design work)
- `pnpm --filter @workspace/api-server run dev` — run the API server directly
- `pnpm --filter @workspace/aura-learning run dev` — run the frontend directly
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed subjects/chapters/topics/tests/questions/important questions + demo student. Re-run after any fresh/empty database (e.g. re-importing the project).
- Required env: `DATABASE_URL` (Postgres), `SESSION_SECRET` (HMAC signing for auth tokens/password hashing)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind, Radix UI, wouter

## Where things live

- `lib/db/src/schema/` — Drizzle schema (students, subjects/chapters/topics, tests/questions, important_questions, bookmarks, progress)
- `lib/db/src/seed.ts` — seed script for demo content
- `artifacts/api-server/src/routes/` — Express routes; `src/lib/auth.ts` has token/password hashing
- `artifacts/aura-learning/src/` — React frontend (pages, components, contexts)

## Architecture decisions

- Auth tokens are HMAC-SHA256 signed (not JWT) using `SESSION_SECRET`; see `artifacts/api-server/src/lib/auth.ts`.
- Frontend injects `Authorization: Bearer <token>` via `setAuthTokenGetter` from `@workspace/api-client-react`, wired in `AuthContext`.

## Product

- Login/signup/guest mode, subject → chapter → topic browsing for CBSE Classes 6–10, timed practice tests with scoring/mastery, important-questions bank, bookmarks, and a points/reward system tied to a student profile.

## User preferences

- User called this "my dream project" — treat polish and correctness as high priority; do your best to keep everything working end to end.

## Gotchas

- The database starts empty on a fresh import/provision. Run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/db run seed` before the app is usable (login will 500 otherwise since no students exist).
- Demo login: `demo@auralearning.com` / `password123`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
