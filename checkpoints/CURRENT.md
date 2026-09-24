# Current state — design-bakery

| Field | Value |
|-------|-------|
| **Last updated** | 2026-09-24 (TASK-DB-0051) |
| **Active tasks** | [TASK-DB-0051 consolidated judge paper](../tasks/TASK-DB-0051-consolidated-judge-paper.md) — PR open, squash-merge on green CI. TASK-DB-0049 (#42) and TASK-DB-0050 (#43) are merged. |

## Repo shape

- `frontend/` — Vite/React site. **One home profile:** `endtoend-engineer` (route `/` → `PortfolioPublicLayout` → `EngineeringHome`). Blog, research papers, case studies (`frontend/extras/*` + `frontend/public/case-studies/*`).
- `backend/` — Express API (Railway) + `backend/services` (CMS, publish kit; Supabase + OpenRouter).
- `packages/cover-studio-kit` — exportable cover/social image generator.
- `supabase/migrations` — Postgres schema.
- CI (`.github/workflows/ci.yml`, Node 24): lint → build → frontend typecheck → backend build → publish-kit fonts smoke test → homepage content stability.

## Known facts

- Tracked content ≈ 50 MB; 38 MB of it is one video (`frontend/public/videos/ekagajpatra-original-nepali-english-subtitles.mp4`). `node_modules` (~610 MB) is the real local disk cost.
- `frontend/public/sitemap.xml` and `*.tsbuildinfo` are build outputs (untracked since TASK-DB-0049).
- Homepage project cards come from `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json` (static; no CMS fetch). Optional `status: "ongoing"` renders an "Ongoing" badge. Rendered newest first by `startedAt` (`lib/projectOrder.ts`, stable sort) — JSON order doesn't matter; every entry needs `startedAt` + `startedAtSource` (enforced by `test:homepage-content`). 4 per carousel page; deep link `/#project-<id>`.
- Static case studies live in `frontend/public/case-studies/<slug>/` (study-os, fossil, fluffy-v4); a tiny redirect component in `modules/case-studies/<slug>/` + routes in `App.tsx` map `/case-studies/<slug>` to the `.html` file; add the path to `scripts/generate-sitemap.mjs`.
- `frontend/src/app/modules/engineering/EngineeringProjects/projects.json` is not imported anywhere (candidate for deletion; owner to confirm).
- Research paper `db-r-2026-010` mirrors Eval Lab `paper/paper.md` (consolidated judge accuracy/coverage paper, source commit `50aeb98`). Figures + `manifest.json` in `frontend/public/research/figures/benchmark/` are copied from Eval Lab `paper/figures/benchmark/`; do not hand-edit numbers — regenerate from Eval Lab.
- `additionals/archive/firebase/` is still read by migration / storage-CORS / publish-kit-upload scripts — keep until those scripts are retired.

## Open threads

- Fluffy V4 handoff/notes stay: they drive the ongoing visual rebuild (Study Partner first). The showcase case study (`/case-studies/fluffy-v4`) uses thumbnails of the current pages — re-capture after each rebuilt direction.
- Homepage "Relevant experience": the rendered list (`relevant-experience-rendered-list.json`, Fitzgerald first) is confirmed correct by the owner.
- Size/modularization follow-ups: [additionals/doc/modularization-plan.md](../additionals/doc/modularization-plan.md).
