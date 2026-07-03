---
name: FiscalCheck preview model
description: How the real Next.js app (apps/web) is served into the Replit preview
---

# Model
This repl uses the **classic webview workflow** model, not the artifact
system (`listArtifacts()` is empty; the app-preview screenshot tool has no
artifact dir to target). The preview shows whatever the `webview` workflow
serves.

- Workflow "Start application" runs the Next.js dev server on port 5000
  (outputType webview), command clears LD_LIBRARY_PATH and sets
  `NEXT_PUBLIC_MSW_ENABLED=true` so the in-browser MSW mocks power the UI
  without the FastAPI backend running.
- `apps/web` dev script binds `-H 0.0.0.0 -p ${PORT:-3000}`; the workflow
  passes `PORT=5000`.
- `apps/web/next.config.ts` omits `X-Frame-Options: DENY` in dev (it blocks
  the preview iframe) and sets `allowedDevOrigins` for the replit.dev proxy
  host. The DENY header is still applied in production.

**Why:** the "Cannot GET /" the user saw was because a prior rewrite pointed
away from a working webview server. A single webview workflow serving the
Next.js app on 5000 fixes the preview.

**How to apply:** to change what the preview shows, edit the "Start
application" workflow. The FastAPI api (`apps/api`) is not required for the
frontend to render (MSW mocks). "Invalid hook call" seen once at startup was
a transient Fast-Refresh/MSW-toggle artifact, not a duplicate-React bug
(only one react@19 is installed).
