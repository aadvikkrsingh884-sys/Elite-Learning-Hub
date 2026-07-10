---
name: Gemini model selection & quota gotchas
description: Which Gemini model names actually work with a fresh/free-tier API key, and how to diagnose 429/404 errors.
---

New Gemini API keys (fresh Google account/project, no billing) often get **0 free-tier quota** on
pinned model names like `gemini-2.0-flash`, and pinned names like `gemini-2.5-flash` / `gemini-2.5-flash-lite`
can also 404 with "no longer available to new users" once Google rotates its lineup.

**Why:** Google frequently deprecates specific dated/pinned model IDs for new API keys while keeping
"latest" aliases pointing at whatever the current default is.

**How to apply:**
- Prefer alias model names (e.g. `gemini-flash-latest`, `gemini-pro-latest`) over pinned versions
  (`gemini-2.0-flash`, `gemini-2.5-flash-lite`) for user-supplied API keys, so the integration doesn't
  break silently when Google retires a dated model.
- To diagnose "which models actually work for this key," call
  `GET https://generativelanguage.googleapis.com/v1beta/models?key=<key>` and grep the returned
  `models[].name` list rather than guessing.
- A 429 with `limit: 0` in the error body means the key/project has zero quota for that specific model —
  switching model name (not retrying) is often the fix, not a billing problem per se.
- Replit's built-in AI Integrations (`ai-integrations-gemini` skill) sidesteps all of this but requires
  the user to accept a one-time account upgrade prompt; if they decline, fall back to their own key + the
  alias-model strategy above.
