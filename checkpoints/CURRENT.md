# Current state — design-bakery

| Field | Value |
|-------|-------|
| **Last updated** | 2026-10-05 (TASK-DB-0063–0067 modularization) |
| **Active task** | Modular restructuring. **Phase 1** = 5 PRs open against `main`: [#74](https://github.com/Pukujan/design-bakery/pull/74) unused deps + dead calendar copies, [#75](https://github.com/Pukujan/design-bakery/pull/75) lazy-load mermaid, [#76](https://github.com/Pukujan/design-bakery/pull/76) lucide icon allowlist, [#77](https://github.com/Pukujan/design-bakery/pull/77) route code splitting, [#79](https://github.com/Pukujan/design-bakery/pull/79) `vendor-react` chunk (stacked on #77). #74–#77 are CI-green; **#79 is not CI-verified** — `ci.yml` triggers only for PRs based on `main`, and #79's base is #77, so it is locally verified (`pnpm lint` + `pnpm run build`) only. Issue [#73](https://github.com/Pukujan/design-bakery/issues/73) owns phase 1; [#78](https://github.com/Pukujan/design-bakery/issues/78) owns phase 2. Prior: TASK-DB-0061 ACS/OIO merged (PRs #68, #69). |

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
- Research paper `db-r-2026-010` mirrors Eval Lab `paper/paper.md` (two-layer judge accuracy/coverage paper, source commit `348676c`). Figures (`NAME.{light,dark}.{wide,tall}.svg`, `NAME.data.json`, `manifest.json`) in `frontend/public/research/figures/benchmark/` are copied from Eval Lab `paper/figures/benchmark/`; do not hand-edit numbers — regenerate from Eval Lab.
- Research paper rendering lives in `frontend/src/app/modules/research/render/` (figures, tables, contents, GitHub alerts, Quick/Full read) with styles in the `.rp-*` / `.research-paper.rp-body` block at the end of `globals.css`. Interactive charts register in `render/figureRenderers.ts`.
- `/ire` (TASK-DB-0057) is a static page, `frontend/public/ire/index.html`, that reads the IRE daily feed (`feed/v2`, open-weight models only) in the browser and falls back to `frontend/public/ire/today.saved.json` (refreshed into `dist` at build time by `scripts/refresh-ire-saved-feed.mjs`). Checks: `pnpm test:ire-page` and `pnpm test:ire-page:browser` (Playwright, needs a build first).
- Agent stack (TASK-DB-0061): the repo is hot-loaded with the ACS multi-agent runtime (`.coord/` — roles, boss lease, claim queue) and OIO issue-log intake (`.oio/`, `.github/ISSUE_TEMPLATE/observational-issue.yml`, `.github/workflows/issue-triage.yml`, marked block in `AGENTS.md`). The `.content-system/` CGM adapter (FULL 0.5.12, eight modules) is the prerequisite ACS validates against; keep it pinned. Pinned dependency checkouts live in `%LOCALAPPDATA%\acs\deps\`, not the dev root. OIO cannot install on native Windows (needs `dir_fd`/`O_NOFOLLOW`) — install/upgrade it from WSL.
- `additionals/archive/firebase/` is still read by migration / storage-CORS / publish-kit-upload scripts — keep until those scripts are retired.
- Modularization phase 1 (TASK-DB-0063…0067, PRs #74–#77 + #79): entry JS **3,412.59 → 710.45 kB** (−79%), entry CSS **644.83 → 206.42 kB**. Every page route is lazy via `lib/lazyPage.tsx`; `manualChunks` in `frontend/vite.config.ts` pins `react*`/`scheduler` to `vendor-react` (entry 527.16 + 182.62 kB — a caching split, not a size cut). Mermaid lazy-loads (`MermaidDiagram.tsx`), lucide is an explicit allowlist (`lib/iconResolver.ts`, guarded by `pnpm test:icon-coverage`). **Do not add a `manualChunks` rule for mermaid** — it collapses mermaid's per-diagram-type dynamic imports into one ~2.7 MB chunk (see `vite.config.ts` comment). Per-route CSS is split but not deduped (total ≈683 kB) — that is phase 2.

## Open threads

- Study OS live app → `https://study.design-bakery.com/` (Study-os D018; not deployed yet as of 2026-09-24). `/studyos` redirects there (`vercel.json`, non-permanent).
- Fluffy V4 handoff/notes stay: they drive the ongoing visual rebuild (Study Partner first). The showcase case study (`/case-studies/fluffy-v4`) uses thumbnails of the current pages — re-capture after each rebuilt direction.
- Homepage "Relevant experience": the rendered list (`relevant-experience-rendered-list.json`, Fitzgerald first) is confirmed correct by the owner.
- Size/modularization: phase 1 done (issue [#73](https://github.com/Pukujan/design-bakery/issues/73)); phase 2 tracked in issue [#78](https://github.com/Pukujan/design-bakery/issues/78) — dedupe the four byte-identical `frontend/extras/*` shadcn UI trees into one workspace package (step 5, mindful of each case study's Tailwind `@source`), then move the 38.4 MB video (step 7). Plan: [additionals/doc/modularization-plan.md](../additionals/doc/modularization-plan.md).
- Self-hosting: frontend half in flight — [#52](https://github.com/Pukujan/design-bakery/issues/52) / TASK-DB-0055 (container `design-bakery-web` verified on `127.0.0.1:8085`, DNS still on Vercel, tunnel hostnames not added). Backend half filed 2026-10-05 as [#80](https://github.com/Pukujan/design-bakery/issues/80) — no gravebuster deployment for the Express API at all (no Dockerfile, no compose service, no tunnel hostname); runbook [docs/self-hosting.md](../docs/self-hosting.md).
- Merge order for the phase-1 stack: PRs #74–#77 are independent; **#79 is stacked on #77** and must merge after it.
