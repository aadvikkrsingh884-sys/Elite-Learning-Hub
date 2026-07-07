---
name: AuraLearning auth design
description: Token security, frontend auth transport, and demo credentials for AuraLearning Elite.
---

## Token design
- Backend: `generateToken(studentId)` uses HMAC-SHA256 with SESSION_SECRET env var (fallback: hardcoded string).
- Format: `base64url(studentId:random:timestamp:sig)` where sig = HMAC of the payload without sig.
- `parseToken()` verifies sig before trusting studentId — not forgeable without secret.

## Frontend auth transport
- `setAuthTokenGetter` from `@workspace/api-client-react` called in `AuthContext` on `login()`, on page load (if token in localStorage), and cleared on `logout()`.
- This injects `Authorization: Bearer <token>` headers into all generated API hooks automatically.

## Access control
- `/results/:resultId` scopes by authenticated studentId via `and(eq(testResultsTable.id, ...), eq(testResultsTable.studentId, student.id))`.

## Demo credentials
- Email: demo@auralearning.com / Password: password123
- Password hash algo: HMAC-SHA256 with secret + static salt "aura_learning_salt_2026"

**Why:** Code review flagged forgeable tokens and IDOR as critical security failures.
**How to apply:** Any new auth-gated route must scope queries by `(req as any).student.id`.
