# Modularization & size-reduction plan

| Field | Value |
|-------|-------|
| **Created** | 2026-09-24 (TASK-DB-0049) |
| **Status** | Proposal — nothing here is implemented yet; each step is its own task/PR |

## Baseline (measured 2026-09-24, after TASK-DB-0049)

| Item | Size |
|------|------|
| Tracked files | ≈ 50 MB, of which **38.4 MB** is `frontend/public/videos/ekagajpatra-original-nepali-english-subtitles.mp4` |
| Full git history (bare clone) | ≈ 48 MB (≈ 37 MB is that same mp4; ≈ 7 MB is already-deleted `dist/`, `src.zip`, a 4.4 MB Figma PNG, old lockfiles) |
| `node_modules` after `pnpm install` | ≈ 610 MB (root virtual store 577 MB + `frontend/node_modules` 34 MB) |
| Production JS main chunk | `index-*.js` ≈ **3.4 MB** minified (≈ 885 kB gzip); no route-level code splitting |
| `frontend/extras` | ≈ 4.1 MB (ONI v3 572 K + v4 592 K + shared assets 2.0 MB, ekagajpatra 488 K, invest-ai 416 K, cortex archive 32 K) |
| Research | `frontend/src/app/modules/research` 412 K + `frontend/public/research` 964 K |

## What lives in the monorepo

1. **Portfolio site** — `frontend/src/app` (home = `endtoend-engineer`, `EngineeringHome`).
2. **Blog + CMS** — public blog pages, admin editors, Express API, `backend/services` (publish kit, Supabase, OpenRouter agents).
3. **Cover studio** — `packages/cover-studio-kit` (already a workspace package) + `modules/cover-studio`.
4. **Case studies** — React apps in `frontend/extras/*` (each a Figma-export app with its own copy of ~48 shadcn `ui/` components), static HTML in `frontend/public/case-studies/*`, the ekagajpatra mp4.
5. **Research papers / benchmarks** — `modules/research` (content + pages) and `public/research/figures`.
6. **Experiments** — `frontend/public/experiments` (616 K, e.g. Fluffy system).

## Proposed steps (in order)

| # | Step | Effort | Risk | Expected savings / benefit |
|---|------|--------|------|----------------------------|
| 1 | **Remove unused dependencies**: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` have **zero imports** in `frontend/src` or `frontend/extras`; lucide-react is already used in ~200 files. Drop them from `frontend/package.json`. | S (≈ 1 h) | Low — typecheck + build prove it | ≈ **100 MB** `node_modules` (icons-material 90 MB + material 11 MB + emotion); faster installs |
| 2 | **Align TypeScript**: frontend on `^6.0.3`, backend + services on `^5.8.3` (resolves 5.9.3). Move all to one version (6.x after checking backend `tsc` output, or pin 5.9 everywhere). | S | Low–Med — TS 6 may flag new errors in backend | ≈ 23 MB `node_modules`; one compiler behaviour |
| 3 | **Lazy-load heavy routes**: `MermaidDiagram` imports `mermaid` statically and is used by blog detail + research paper pages. Wrap `BlogDetailPage`, `ResearchPaperPage`, the case-study pages and the admin shell in `React.lazy` / dynamic `import('mermaid')`. | M (½–1 day) | Low–Med — watch SEO head tags / Suspense fallbacks | Main chunk 3.4 MB → est. **< 1 MB**; much faster first paint on `/` |
| 4 | **date-fns**: only used transitively by `react-day-picker@8` via shadcn `ui/calendar.tsx` copies. If no page renders a calendar, delete the unused `calendar.tsx` files and both deps; otherwise upgrade to react-day-picker 9 (no date-fns peer). | S | Low | ≈ 31 MB `node_modules` |
| 5 | **Case studies → workspace package** `packages/case-studies` (or one package per study) with a shared `ui/` folder instead of four copies of the same ~48 shadcn components; keep the `@…-case-study` aliases pointing at the package so routes don't change. Alternative: build each study as a static site into `frontend/public/case-studies/<name>/` (like cortex/fossil/study-os already are) and drop the React integration. | M–L (1–2 days) | Med — CSS scoping (Tailwind `@source`), OG images, routes | Removes ≈ 3 duplicate `ui/` copies (≈ 0.5–0.8 MB source), simpler `vite.config.ts`/`tsconfig.json`, smaller frontend typecheck surface |
| 6 | **Research → content package** `packages/research-content` (papers, sources, figure manifest) consumed by `modules/research`; figures stay in `public/research` or move to Supabase Storage. | M | Low–Med | Clear ownership boundary; enables separate repo later if benchmarks grow |
| 7 | **Move the mp4 to external storage** (Supabase Storage bucket or YouTube/Vimeo embed), update the ekagajpatra case study to the new URL. **Only after that**, as a **separate, explicitly approved** step: purge it from history with `git filter-repo --path frontend/public/videos/ekagajpatra-original-nepali-english-subtitles.mp4 --invert-paths` (+ the old `dist/`, `src.zip`, figma PNG), force-push, and have every clone re-clone. | S (move) + S (purge, but coordination-heavy) | Move: Low. Purge: **High** — rewrites all SHAs, breaks open PRs/forks, needs a freeze window | Checkout −38 MB, `dist` −38 MB, history ≈ 48 MB → ≈ 4 MB |
| 8 | **Retire Firebase leftovers** once the Firestore→Supabase migration is confirmed done: `additionals/archive/firebase/`, `scripts/migrations/migrate-firestore-to-supabase.ts`, `scripts/apply-storage-cors.mjs`, the Firestore prefix map in `backend/services/src/content/collectionKey.ts`. | S | Low–Med | Less confusing code paths |
| 9 | **Unrouted admin editors**: design-portfolio editors (`AboutEditor`, `SkillsEditor`, `AdvocacyEditor`, `ArtGalleryEditor`, `WebShowcaseEditor`, `GalleryPageEditor`) and `modules/design` are no longer routed. Delete or re-route. | S | Low | Smaller admin surface |

## Should anything become a separate repo?

- **Not yet.** Everything deploys from one Vercel project + one Railway service and shares the same UI kit. Start with workspace packages (steps 5–6); split to a separate repo only if a section gets its own deploy target or collaborators (most likely candidates: research/benchmarks, and the case-study static builds).
- `packages/cover-studio-kit` is already exportable (`pnpm run export:cover-studio`) and can stay as-is.

## Combined estimate

Steps 1–4 (low risk, ≈ 1–2 days): **≈ 150 MB less `node_modules`** and a main bundle roughly 3× smaller. Step 7 is the only change that materially shrinks the git repo itself.
