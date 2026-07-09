---
name: AuraLearning mobile UI and download engine
description: Mobile-first layout changes and download resource engine added in July 2026 session.
---

## Mobile-first layout
- **Sidebar**: `hidden md:flex` — invisible on mobile, full sidebar on md+ screens
- **BottomNav**: `fixed bottom-0 md:hidden` — 6 items: Home, Subjects, Topics, Tests, Downloads, Me. Has `aria-current="page"` on active link. Located at `artifacts/aura-learning/src/components/layout/BottomNav.tsx`
- **AppLayout**: main content uses `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-6` to avoid bottom nav overlap. Also includes `BottomNav` after the sidebar.
- **Header**: compact on mobile (brand name shown since sidebar hidden), search bar `hidden sm:flex`, avatar shrinks on mobile.
- **Existing features preserved**: Dashboard, Help, AI Chatbot/Help Buddy all unchanged — only layout/nav changes.

## Download Resource Engine
- **Table**: `study_resources` (id, title, resource_type text, class_id, subject_id, chapter_id FK, file_url nullable, description, created_at). `resource_type` is text/app-validated (not a DB enum) against: PYQ, TopperNote, VIPNote, CheatSheet, SamplePaper, RevisionNote.
- **API routes** (`artifacts/api-server/src/routes/resources.ts`):
  - `GET /resources?chapterId=&subjectId=&classId=` — filtered list
  - `GET /resources/:id/download` — generates a single-page PDF in-memory using raw PDF syntax (no pdfkit dependency). Non-Latin-1 text (Devanagari chapter titles) is transliterated/sanitized before PDF encoding to prevent mojibake.
- **ResourceDownloadPanel** (`artifacts/aura-learning/src/components/ResourceDownloadPanel.tsx`): rendered inside the Topics page topics card. Falls back to 6 graceful placeholder cards when no DB resources exist for a chapter (download hits the server endpoint with the resource ID).
- **Resources page** (`artifacts/aura-learning/src/pages/Resources.tsx`): full dedicated downloads hub at `/resources`, reachable from BottomNav "Downloads" and Sidebar.
- **Topics.tsx integration**: useQuery fetches resources for active chapter; response validated at runtime before passing to ResourceDownloadPanel (array guard + field type check).

## Why PDF is generated server-side
File storage (S3 / object storage) is not yet configured. The server generates a structurally valid single-page PDF on demand using raw PDF 1.4 object syntax — no extra npm dependency. When real files are uploaded, populate `study_resources.file_url` and the download endpoint will redirect to that URL instead of generating.
