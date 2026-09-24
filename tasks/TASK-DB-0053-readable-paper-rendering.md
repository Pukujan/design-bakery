# TASK-DB-0053 — readable research paper rendering (db-r-2026-010)

| Field | Value |
|-------|-------|
| **Created** | 2026-09-24 |
| **Issue** | [#48](https://github.com/Pukujan/design-bakery/issues/48) |
| **PR** | [#51](https://github.com/Pukujan/design-bakery/pull/51) |
| **Branch** | `task/TASK-DB-0053-readable-paper-rendering` |
| **Source** | Eval Lab TASK-0058, PRs [Pukujan/Eval-lab#68](https://github.com/Pukujan/Eval-lab/pull/68) and [#72](https://github.com/Pukujan/Eval-lab/pull/72), merge commit `348676ce7602c133038346d1e95b0dc953e7f188` |
| **Status** | PR open; do not merge until the owner reviews the preview. |

## Goal

Make `/research/papers/*` comfortable to read on any screen, following the UX
research on issue #48, and mirror Eval Lab's two-layer paper (quick read +
deep dive) with light/dark and wide/tall figure variants.

## Done

- **Typography:** Source Serif 4 body at 18px (19px at ≥1280px), line height
  1.65, ~68-character measure; IBM Plex Sans headings (h2 26px, h3 20px, h4
  small caps) with the section number as a muted prefix; lining numbers in
  prose, tabular numbers in tables. Both faces are loaded only on research
  pages (Google Fonts link added by the page).
- **Layout:** sticky contents rail at ≥1200px (h2/h3, active-section
  highlight via IntersectionObserver), a floating "Contents" sheet below
  that, a reading-progress bar, figures and tables widen to 960px, and the
  header clears the fixed site nav (back link and status pill were hidden).
- **Two layers:** "Quick read / Full read" switch (state in `?read=quick`,
  default full) hides `details.deep-dive` blocks and the appendices; deep-dive
  blocks and appendix `<details>` are styled as quiet collapsed rows; the
  subtitle and each finding's bold takeaway have their own styles.
- **Callouts:** GitHub alert syntax (`> [!NOTE]`, `TIP`, `IMPORTANT`,
  `WARNING`, `CAUTION`, `KEY`, `SUMMARY`) via `render/remarkGithubAlerts.ts`;
  IMPORTANT/KEY/SUMMARY render as the summary card; `<aside class="rp-meta">`
  is the status/evidence/repository line.
- **Figures:** `render/PaperFigure.tsx` turns `<figure data-figure="NAME">`
  into the SVG variant matching `html.dark` and the viewport (tall below
  700px); print always uses light/wide; the zoom dialog opens the same
  variant. Captions: figure label, bold first-sentence takeaway, muted rest.
  A ```` ```chart ```` fence (`{"figure", "base", "alt", "caption"}`) renders
  the same component.
- **Interactive-chart plumbing:** `render/figureRenderers.ts` is the
  registry an interactive renderer (TASK-DB-0054, #49) plugs into; it gets
  `NAME.data.json`, theme and layout, and the static SVG stays as the
  fallback and print version. Nothing is registered yet.
- **Tables:** `render/PaperTable.tsx` — booktabs rules, 14.5px Plex Sans,
  tabular numbers, right-aligned `nowrap` numeric columns, CI shown as
  `x (a–b)` with a smaller muted interval, sticky header and first column in
  their own scroll box with a right-edge fade, "Show all N rows" for tables
  over 10 rows (not inside `<details>`), optional `highlight` class.
- **Content:** `db-r-2026-010.md` regenerated from Eval Lab `paper/paper.md`
  (figure paths point at `/research/figures/benchmark/`, generated markers
  removed, `main` links pinned to the merge commit, meta line wrapped in
  `<aside class="rp-meta">`). The 24 SVG variants, 6 `data.json` files and
  `manifest.json` replace the old PNG/SVG figures. Registry title and abstract
  follow the new paper.

## Evidence

- Local: `pnpm run lint`, `pnpm --dir frontend run typecheck`,
  `pnpm run build` (box); `node scripts/test-homepage-content-stability.mjs`
  (PC, Node 24).
- Before/after screenshots (desktop 1440 and mobile 390, light and dark):
  see issue #48.

## Next step

Owner reviews the Vercel preview. Interactive charts follow in TASK-DB-0054
(#49) through `figureRenderers.ts`.
