# Current state — design-bakery

| Field | Value |
|-------|-------|
| **Last updated** | 2026-09-24 (TASK-DB-0049) |
| **Active task** | [TASK-DB-0049 repo cleanup](../tasks/TASK-DB-0049-repo-cleanup.md) — PR open, awaiting review |

## Repo shape

- `frontend/` — Vite/React site. **One home profile:** `endtoend-engineer` (route `/` → `PortfolioPublicLayout` → `EngineeringHome`). Blog, research papers, case studies (`frontend/extras/*` + `frontend/public/case-studies/*`).
- `backend/` — Express API (Railway) + `backend/services` (CMS, publish kit; Supabase + OpenRouter).
- `packages/cover-studio-kit` — exportable cover/social image generator.
- `supabase/migrations` — Postgres schema.
- CI (`.github/workflows/ci.yml`, Node 24): lint → build → frontend typecheck → backend build → publish-kit fonts smoke test → homepage content stability.

## Known facts

- Tracked content ≈ 50 MB; 38 MB of it is one video (`frontend/public/videos/ekagajpatra-original-nepali-english-subtitles.mp4`). `node_modules` (~610 MB) is the real local disk cost.
- `frontend/public/sitemap.xml` and `*.tsbuildinfo` are build outputs (untracked since TASK-DB-0049).
- `additionals/archive/firebase/` is still read by migration / storage-CORS / publish-kit-upload scripts — keep until those scripts are retired.

## Open threads

- Fluffy V4 handoff/notes stay (source material for the Fluffy V4 showcase page).
- Homepage "Relevant experience": the rendered list (`relevant-experience-rendered-list.json`, Fitzgerald first) is confirmed correct by the owner.
- Size/modularization follow-ups: [additionals/doc/modularization-plan.md](../additionals/doc/modularization-plan.md).
