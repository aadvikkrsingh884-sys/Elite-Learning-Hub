---
name: AuraLearning Google OAuth + PWA
description: Google OAuth (GIS token flow), password reset via Resend, and PWA service worker architecture decisions.
---

## Google OAuth
- Uses Google Identity Services (GIS) token flow — frontend gets an ID token via google.accounts.id, POSTs to /api/auth/google.
- Backend verifies with google-auth-library OAuth2Client.verifyIdToken against GOOGLE_CLIENT_ID secret.
- VITE_GOOGLE_CLIENT_ID set as shared env var (non-secret, safe for browser).
- **Important:** Authorized JavaScript origins in Google Cloud Console must include the live Replit domain. The preview proxy (127.0.0.1) shows a 403 in dev — this is expected; add the public URL for production testing.

## DB Schema additions (applied via raw SQL — drizzle-kit requires TTY so cannot be run non-interactively)
- password_hash made nullable — Google-only users have no password.
- google_id text UNIQUE — Google OAuth sub ID.
- reset_token text — SHA-256 hashed reset token.
- reset_token_expiry timestamp — 1-hour expiry window.
- Default classLevel changed 8 → 9 (Class 9 platform focus).

## Password Reset
- Raw 32-byte hex token sent in email; SHA-256 hash stored in DB.
- FROM address: RESEND_FROM_EMAIL env var (defaults to onboarding@resend.dev — user must verify a domain in Resend for production).
- /forgot-password always returns 200 to prevent email enumeration.

## PWA / Service Worker
- SW at artifacts/aura-learning/public/sw.js, registered in main.tsx on window load event.
- Cache strategies: shell (/, /index.html) SHELL_CACHE; /assets/* STATIC_CACHE cache-first; PDFs PDF_CACHE cache-first; /api/* network-only; navigation network-first with offline fallback.
- Background Sync tag: aura-progress-sync — SW flushes IndexedDB pending-syncs store on reconnect.
- Inline flush fallback in requestBackgroundSync() covers Safari/Firefox where Background Sync API is unavailable.

## Offline Chat UX
- StudyBuddyChat uses useOnlineStatus() hook (window online/offline events).
- Offline: shows "AI Tutor is offline. Connect to the internet to clear your doubts!" panel.
- Floating button switches to WifiOff icon when offline.
