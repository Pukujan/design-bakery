# TASK-DB-0069 — modularization phase 2: delete the dead code the orphan detector found

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | [#78](https://github.com/Pukujan/design-bakery/issues/78) (remaining modular restructuring) |
| **Branch** | `task/TASK-DB-0069-modularization-phase2` |
| **Status** | In progress — deletion + detector fix done and verified locally; PR open. |

## Goal

Issue #78's premise was that the four `frontend/extras/*` case-study apps carry four
near-duplicate copies of the shadcn UI tree, and the fix was to dedupe them into a
shared workspace package. The orphan detector added in TASK-DB-0068
(`scripts/find-orphans.mjs`) showed something simpler and better: most of those
`ui/` trees are **not imported at all**. So the fix is deletion, not a package.

## What the detector found (before this task)

267 unreferenced files. The case-study apps themselves are **live** — `frontend/src`
reaches each through its tsconfig/vite alias (`@ekagajpatra-case-study/*`,
`@invest-ai-case-study/*`, `@oni-agent-case-study-v3|v4/*`) — but the `ui/` subtrees
inside them are dead:

| App | `ui/` files | Reachable | Dead |
|-----|-------------|-----------|------|
| `Create Presentation Case Study` (ekagajpatra) | 47 | `button`, `dialog`, `utils` | 44 |
| `invest-ai-case-study` | 47 | none | 47 |
| `oni_agent_interactive_page_svg_darkmode_src` (v3) | 47 | none | 47 |
| `oni_agent_interactive_page_svg_darkmode_v4_src` (v4) | 47 | none | 47 |
| `frontend/src/app/components/ui` | — | — | 36 |

Plus 23 more dead files in the extras apps (`FormSystemsSectionV2.tsx`; the copied
`components/investai/**` and `components/figma/**` trees in both ONI apps) and a few
small dead modules (`src/app/data/blogData.ts` shim, `modules/blog/index.ts` barrel,
`modules/blog/seo/blogSeo.ts`, `modules/admin/components/FormArrayEditor.tsx`,
`backend/services/src/{callableCors,loadEnv}.ts`).

## Done

- Deleted 250 files (185 extras `ui/`, 23 other extras, 36 `frontend/src` shadcn, 6
  small modules). Committed as one change so the numbers are reproducible.
- Fixed two bugs in `scripts/find-orphans.mjs` that made it report live backend files
  as orphans on Windows: the `services/lib` → `services/src` rewrite was
  separator-sensitive, and the compiled `lib/*.js` (which exists locally) was tried
  before the source.

## Evidence (Windows 11 / Node 24 / pnpm 10.32.1, `pnpm run build`)

| Stylesheet | Before | After |
|---|---|---|
| **total CSS** | **671.4 kB** | **334.3 kB** (−50%) |
| `index.css` | 204.1 kB | 156.1 kB |
| `AiAgentsCaseStudyV3Page` | 125.8 kB | 42.7 kB |
| `AiAgentsCaseStudyV4Page` | 125.3 kB | 41.7 kB |
| `EkagajpatraCaseStudyPage` | 100.7 kB | 43.2 kB |
| `InvestAiCaseStudyPage` | 107.5 kB | 42.6 kB |
| `LegalWorkflowResearchCaseStudyPage` | 8.0 kB | 8.0 kB |

Each case-study page imports its own Tailwind entry
(`@import 'tailwindcss' source(none); @source '../**/*.{js,ts,jsx,tsx}'`), so it was
scanning its own dead `ui/` tree; `frontend/src/styles/index.css` also `@source`s the
extras trees. Removing the dead files drops those classes from both. JS is unchanged —
the deleted files were never imported.

- Orphans: **267 → 12**, and the 12 that remain are intentional keeps.
- `pnpm lint`, `pnpm --dir frontend run typecheck`, `pnpm --dir backend run build`,
  `pnpm run build`, `pnpm test:homepage-content`, `pnpm test:icon-coverage`,
  `pnpm test:ire-page` all pass.

## Kept on purpose

- `frontend/src/app/modules/photo-gallery/**` (10 files) — unrouted, but it is the
  work-in-progress for open feature issue
  [#24](https://github.com/Pukujan/design-bakery/issues/24). Not dead; unfinished.
- `packages/cover-studio-kit/examples/**` (2 files) — intentional examples, not
  imported by design.

## Next step

- Merge when CI is green.
- Then issue #78 step 7: move the 38.4 MB
  `frontend/public/videos/ekagajpatra-original-nepali-english-subtitles.mp4` out of
  git history / into storage.
- Then promote `orphans` to a required check (`pnpm find:orphans:strict`), now that
  the backlog is down to intentional keeps.
