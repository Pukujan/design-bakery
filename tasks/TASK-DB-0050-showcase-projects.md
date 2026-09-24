# TASK-DB-0050 — showcase projects (Fluffy V4 case study + ongoing projects)

| Field | Value |
|-------|-------|
| **Created** | 2026-09-24 |
| **Branch** | `task/TASK-DB-0050-showcase-projects` (branched from `task/TASK-DB-0049-repo-cleanup`) |
| **Depends on** | PR #42 (TASK-DB-0049). Until #42 merges, this PR's diff also shows #42's commits. |
| **Status** | PR open against `main`, awaiting review. Do not merge without owner approval. |

## Goal

1. Add **Fluffy V4** to the homepage Engineering Projects showcase, with its own standalone static HTML case-study page wired exactly like Study OS / FOSSIL.
2. Add three **ongoing** projects to the showcase: Eval Lab, Project Continuity Modules, Inference Recommendation Engine. Use only facts from each repo (README, recent commits), no invented metrics, and a visible "Ongoing" marker.

## Done

- **Status field + badge:** `Project.status?: 'ongoing'` (`frontend/src/app/lib/adminContentService.ts`). `EngineeringProjects.tsx` renders a small yellow "Ongoing" pill (black border, hard shadow) next to the featured card title and above the title on the small carousel cards.
- **Project data** (`frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json`): appended ids 8–11 after the existing seven cards. (Superseded by the newest-first ordering below.)
  - 8 Fluffy V4: status `ongoing`. Links: Case Study `/case-studies/fluffy-v4`, Live V4 Gallery `/case-studies/fluffy-v4/gallery`, and GitHub · Public (`Pukujan/fluffy-system`).
  - 9 Eval Lab: GitHub · Public (`Pukujan/Eval-lab`) and Research Paper `/research/papers/db-r-2026-010`.
  - 10 Project Continuity Modules: GitHub · Public (`Pukujan/project-continuity-modules`).
  - 11 Inference Recommendation Engine: GitHub · Public (`Pukujan/inference-recommendation-engine`).
  - The three ongoing repos get a card only, with no detail page. They are active research/tooling repos with no stable story or results to write up yet, and each README is the natural detail page.
- **Fluffy V4 case study (static page, Study OS pattern):**
  - `frontend/public/case-studies/fluffy-v4/index.html`: a self-contained page with inline CSS in Design Bakery's neo-brutalist style (cream, black borders, hard shadows) and Fluffy amber/rust accents.
  - Sections: hero, problem (the sourced Ahrefs 2025 stat from the fluffy-system README), how it works, V1→V4 evolution with links to each unlisted gallery, the eight V4 directions, what V4 taught (the failures plus the rebuild pipeline), status/next, claim boundaries, CTA and footer.
  - `frontend/public/case-studies/fluffy-v4/assets/v4-*.webp`: 8 thumbnails captured with headless Chrome from the live `/experiments/fluffy-system-v4/*.html` pages at 1448×1086, scaled 0.5 (about 17–41 KB each).
  - `frontend/src/app/modules/case-studies/fluffy-v4/FluffyV4CaseStudyRedirect.tsx` plus routes in `App.tsx`:
    - `/case-studies/fluffy-v4` redirects to `/case-studies/fluffy-v4/index.html`.
    - `/case-studies/fluffy-v4/gallery` redirects to `/experiments/fluffy-system-v4/index.html`, because a card `<Link>` straight to `/experiments/...` would hit the SPA NotFound.
  - `scripts/generate-sitemap.mjs`: added `/case-studies/fluffy-v4`. The experiment galleries stay out of the sitemap and remain `noindex`.
  - `vercel.json`: no change needed (Vercel serves directory `index.html`, the same as study-os).
- **Newest-first ordering (owner request on PR #43):** every project has `startedAt` (`YYYY-MM-DD`, or `YYYY-MM` when only the month is known) plus `startedAtSource` (the evidence, not rendered). `frontend/src/app/lib/projectOrder.ts` → `sortProjectsByStartedAtDesc` (stable; missing/invalid dates last) is applied in `EngineeringProjects.tsx`, so new entries sort themselves; the JSON array is not hand-reordered. Repo `createdAt` (UTC) converted to ET calendar dates.

  | Rendered order | startedAt | Source |
  |---|---|---|
  | Inference Recommendation Engine | 2026-09-22 | repo creation, Pukujan/inference-recommendation-engine (public) |
  | Project Continuity Modules | 2026-09-20 | repo creation, Pukujan/project-continuity-modules (public) |
  | Fluffy V4 | 2026-09-08 | repo creation, Pukujan/fluffy-system (public); first Fluffy gallery commit here same day |
  | Study OS | 2026-08-23 | repo creation, Pukujan/Study-os (public; 2026-08-24T02:18Z) |
  | FOSSIL | 2026-08-09 | no repo on card → earliest fossil* repo, Pukujan/fossil-core (public) |
  | Eval Lab | 2026-07-30 | repo creation, Pukujan/Eval-lab (public) |
  | Cortex | 2026-06-24 | no repo on card → earliest cortex* repo, Pukujan/stupidly-simple-cortex (private; 2026-06-25T02:16Z); inferred via the case study's `scc-v2` review files — best evidence |
  | Legal Workflow Research | 2026-05-29 | repo creation, linked Pukujan/litigation-prompt-engineering-v2 (private); related litigation repos go back to 2026-04 |
  | ONI vs My Agent Ready Architecture | 2026-05-23 | repo creation, linked Pukujan/create-modular-monolith (private) |
  | Ekagajpatra | 2023-02 | relevant-experience entry (Feb 2023 – Apr 2024) |
  | SaaS Dashboard Systems | 2016-06 | relevant-experience entry Kulchan Pvt. Ltd, Solutions Engineer (Jun 2016 – Dec 2018), same scope |

- **Test:** `scripts/test-homepage-content-stability.mjs` now also asserts:
  - project ids are unique
  - every project has exactly 3 stats
  - `status` is either absent or `ongoing`
  - Fluffy V4 links to its case study, and the static file exists
  - all three ongoing repos are present and marked `ongoing`
  - every project has a valid `startedAt` and a `startedAtSource`; the rendered order (via `sortProjectsByStartedAtDesc`, imported from TS under Node 24 type stripping) is newest first; ties keep data order; the carousel component calls the sort

## Sources used (nothing else)

- Fluffy:
  - `additionals/handoffs/fluffy-v4-visual-rebuild/README.md`
  - `additionals/guidelines/agent-devlog-fluffy-v4-visual-rebuild.md`
  - `additionals/guidelines/dev-log-2026-09-08-fluffy-system.md`
  - `frontend/public/experiments/fluffy-system*/`
  - git log for those paths (2026-09-08 → 09-10)
  - the `Pukujan/fluffy-system` README
- Placeholder stats and the testimonial in the Study Partner reference mockup (10K+, 2.3K, 96%) are design content. They are **not** used.
- Ongoing repos: `gh repo view` plus README plus recent commits for each. All three repos are **public**.
- Research Assurance (a Fluffy pilot product) is **private**. It is described but never linked.

## Evidence

- All `ci.yml` steps pass locally on Node 24.21.0 / pnpm 10.32.1: lint, build, frontend typecheck, backend build, publish-kit fonts test, and homepage content stability.
- Dev servers (Vite 5300, API 8787) were checked with headless Chrome:
  - `/#project-8` … `/#project-11` feature the new cards with the Ongoing badge.
  - `/case-studies/fluffy-v4` redirects to the static page.
  - `/case-studies/fluffy-v4/gallery` redirects to the V4 gallery.
  - The page has no horizontal overflow at 390 px.
  - There are no import errors. The only console noise is pre-existing: the unkeyed `<Route>` key warning, `8787/api/public/*` 500s without Supabase env, and a favicon 404.
- Screenshots (local, not committed): `/workspace/screens/`.

## Next step

- Owner reviews the PR (after or together with #42).
- Open questions for the owner:
  - two linked repos on existing cards are private (create-modular-monolith on ONI, litigation-prompt-engineering-v2 on Legal) — public visitors get a 404 from those links.
  - should Fluffy keep the Ongoing badge?
  - should the ongoing repos get detail pages later?
- Fluffy V4 rebuild itself: follow the handoff (Study Partner first). When pages are rebuilt, re-capture the thumbnails in `frontend/public/case-studies/fluffy-v4/assets/`.
