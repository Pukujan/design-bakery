# design-bakery — layout and MVC mapping

The repo is a **monorepo**: Vite/React frontend, Express API, and shared Firebase/LLM logic. We use familiar MVC terms to describe roles; we did **not** rename every React file to `controllers/` — the existing module layout already matches the layers.

## Top-level directories

| Path | Role |
|------|------|
| `frontend/` | Public site + admin UI (Vite, React, Tailwind); case-study sandboxes in `frontend/extras/` |
| `backend/` | HTTP API + shared server logic |
| `backend/services/` | Domain services (publish kit, CMS, OpenRouter) — Express + optional Firebase callables |
| `firebase/` | Firebase CLI config, Storage rules, CORS — [firebase/README.md](../firebase/README.md) |
| `supabase/` | Postgres migrations — [supabase/README.md](../supabase/README.md) |
| `scripts/` | Dev orchestration — [scripts/README.md](../scripts/README.md) |
| `archive/` | Historical exports (not indexed by CodeGraph) |

## Backend (Express) — MVC-style layers

```
backend/
  src/
    server.ts              # App bootstrap, routes, global error handler
    config/env.ts          # Env loading (backend/.env, repo .env)
    middleware/
      auth.ts              # Firebase ID token + admin allowlist
      httpErrors.ts        # Map domain errors → JSON responses
    api/
      publishKit.ts        # POST /api/publish-kit
      blogAgent.ts         # (removed) — use publish-kit only
  services/src/           # Models + services (not HTTP-specific)
    blog/                  # Publish kit, Firestore, agents
    firebaseApp.ts         # Admin SDK singleton
  secrets/                 # Local service account JSON (gitignored)
```

| MVC | Backend location |
|-----|------------------|
| **Model** | `backend/services/src/blog/*`, Firestore helpers, types |
| **View** | N/A — JSON API only |
| **Controller** | `backend/src/api/*` — thin routers; call into `services/lib` |
| **Middleware** | `backend/src/middleware/*` — auth, error shaping |
| **Config** | `backend/src/config/env.ts`, `backend/.env` |

## Frontend — MVC-style layers

```
frontend/src/app/
  lib/                     # Shared clients, Firebase init, normalizers
  modules/
    engineering/           # Public engineering pages
    blog/                  # Blog list/detail + studio (admin)
    admin/                 # Admin shell and content tools
  components/              # Reusable UI (nav, footer, icons)
```

| MVC | Frontend location |
|-----|-------------------|
| **Model** | `lib/*`, `modules/*/data`, Firestore-shaped types |
| **View** | `modules/*/…Page.tsx`, `components/*` |
| **Controller** | Hooks and `*Client.ts` / `*Api.ts` under `modules/blog/studio`, `lib/blogApi.ts` |

Admin blog flows: UI → `publishKitClient.ts` → `VITE_BLOG_API_URL` → Express `api/publishKit` → `handlePublishKit` in functions.

## Secrets and env

- **Frontend:** `frontend/.env` — only `VITE_*` (Firebase client, API URL).
- **Backend:** `backend/.env` — OpenRouter, Admin credentials, bucket, CORS.
- **Local Admin JSON:** `backend/secrets/firebase-service-account.json` (or `GOOGLE_APPLICATION_CREDENTIALS_JSON` on Railway).
- Never commit `.env` or `*-firebase-adminsdk-*.json`.

## Local dev

```bash
pnpm run dev:stack   # frontend :5300 + API :8787
```

Health: `http://localhost:8787/health`
