# TASK-DB-0054: Reusable interactive research chart component

| Field | Value |
|-------|-------|
| **Created** | 2026-09-24 |
| **Issue** | #49 |
| **Branch** | `task/TASK-DB-0054-research-chart` |
| **Status** | In progress — PR open for review |

## Goal

A **generic** research chart for papers: a ```chart fenced block in the markdown carries a
JSON spec, the dataset loads lazily from `/research/data/<id>.json`, and the chart renders as
hand-built React SVG on the small d3 modules (`d3-scale`, `d3-array`, `d3-format`) — no chart
library. It must work for **any project's** data, not only eval-lab: the component takes a
dataset object and knows nothing about where it came from, because phase 2 reuses it as a
workspace package (`packages/research-chart`) inside the live Eval Lab app.

MVP surface (from the #49 findings comment):

- Dot-with-95%-interval chart, plus a bar variant.
- Metric switching, detail level (summary / breakdown / experiments / runs / raw table),
  filter chips built from the dataset's own dimensions, sort, highlight.
- Hover **and** tap-to-pin tooltips, keyboard navigation, a table fallback, CSV download.
- Horizontal layout on wide screens; stacked rows (label above the bar) below 560px, labels
  never rotated.
- Themed through CSS variables so light and dark both work.
- A build-time Node validator that fails on a bad dataset/metric reference and renders static
  light + dark SVGs from the same render function, as the no-JavaScript and print fallback.

## Blind-set safety (non-negotiable)

The eval-lab data behind this is a blind set. Three rules are enforced in code and in tests:

1. **No item-level or gold-label view.** The finest granularity the chart can emit is one row
   per arm per slice. `scripts/test-research-charts.mjs` asserts the exact key set of a
   `ChartRow` (14 keys) and a `ChartTableRow` (9 keys), and scans every row's entity blob for
   `/gold|expected_answer|item_?id|question_?id|label_?text/i`.
2. **No cross-entity arithmetic in the browser.** Rows are read straight out of
   `dataset.observations`, field for field — nothing is averaged, pooled or re-derived. Only
   aggregates the data file already publishes are shown.
3. **No free-text harness.** Structured metadata (thinking, max_tokens) is carried as fields;
   `harness` free text is not a dimension.

## Architecture

| Piece | File | Role |
|-------|------|------|
| Schema | `frontend/src/app/modules/research/chart/schema/research-chart-data.v1.schema.json` | The dataset contract (draft 2020-12), copied from eval-lab. `chart-provenance.shapes.ttl` documents the provenance shapes. |
| Types | `chart/types.generated.ts` | Generated from the schema by `scripts/research-gen-types.mjs`; `--check` fails on drift. |
| Spec | `chart/spec.ts` | Parses and validates the ```chart JSON: dataset id, metric, level, type, sort, filters, facet, highlight, controls, caption, height. Level-aware facet scope (`slice` vs `entity`). |
| Compute | `chart/compute.ts` | Pure `computeChartModel(dataset, spec, state)` → rows + layout facts. The single source of every number the chart shows. |
| SVG | `chart/ResearchChartSvg.tsx` | Pure React SVG. Takes a `colors` object and a `colorMode` (`css` for the page, literal hex for the files), so the interactive chart and the static files come from one render path. |
| Interactive | `chart/ResearchChart.tsx` | Owns reader state (metric, level, type, sort, filters, active row), `ResizeObserver` width, tooltip, table, CSV. `React.lazy`-loaded. |
| Embed | `chart/ResearchChartEmbed.tsx` | Loads the dataset lazily, shows the build-time static SVG until the interactive chart is on screen (and keeps it if the chunk never arrives). |
| Dataset | `chart/dataset.ts` | Resolves an id through `/research/data/index.json`, with a flat `<id>.json` fallback. Nothing eval-lab-specific beyond that convention. |
| Theme | `chart/theme.ts` + `frontend/src/styles/globals.css` | `--rc-*` tokens for light and dark. The literal hexes are duplicated in `theme.ts` on purpose: a static SVG in an `<img>` cannot read CSS variables. A test parses the CSS block and proves the two agree. |
| Static entry | `chart/static.tsx` | One esbuild entry point for Node; re-exports the whole pure surface so the validator and the test share it. |

## Build-time pipeline

| Script | What it does |
|--------|--------------|
| `pnpm research:sync-data` | Copies `paper/data/index.json`, `judges-blind-760.json` and `charts/*.json` from Pukujan/Eval-lab into `frontend/public/research/data/` and verifies every sha256 against the manifest. |
| `pnpm research:gen-types` | Regenerates `types.generated.ts` from the schema. |
| `pnpm research:validate-charts` | Parses every ```chart block in `research/content/*.md`, validates it against its dataset, and renders `frontend/public/research/charts/<slug>.<theme>.svg` (+ `.narrow.svg`) from the same render function as the page. Writes `manifest.json`. |

`--check` on each of the three makes it verify-without-writing; all three run as CI steps
before the build, which is what catches a data file, a generated type or a static SVG that has
drifted from the spec that produced it. The validator is also wired into the frontend
`prebuild` and `predev`.

Static SVG filenames come from `chartSlug`: a readable prefix plus an FNV-1a 32-bit hash of
the key-sorted canonical spec, so Node and the browser agree with no build state. The
validator hard-fails on a slug collision.

## Anti-drift guards

- `schemaVersion` is checked on every dataset load; an unknown version is an error, not a
  best-effort parse.
- The sha256 manifest (`index.json`) is the pin. Note: `index.json`'s `commit` field is the
  exporter's HEAD, **not** the commit carrying the exported files — the hashes are the
  effective pin, and both the sync script and the validator enforce them.
- CI fails on an unknown dataset id or metric in a ```chart block.

## Files touched

| File | Notes |
|------|-------|
| `frontend/src/app/modules/research/chart/*` | New module (schema, types, spec, compute, SVG, chart, embed, dataset, theme, format, static). |
| `frontend/src/app/modules/research/public/ResearchPaperPage.tsx` | `chart` branch in the markdown `code` override; `ChartSpecError` for a bad spec. |
| `frontend/src/app/modules/research/content/db-r-2026-010.md` | One demo ```chart block (the only change to that file). |
| `frontend/src/styles/globals.css` | `--rc-*` tokens + `.rc-*` component styles, including the 560px stack and print rules. |
| `scripts/research-sync-data.mjs`, `research-gen-types.mjs`, `research-validate-charts.mjs`, `research/chart-pipeline.mjs`, `test-research-charts.mjs` | New. |
| `package.json`, `frontend/package.json` | Scripts + the three d3 modules + `esbuild`. |
| `.github/workflows/ci.yml` | Three drift checks before the build, plus `test:research-charts`. |

## Next steps

- Phase 2: extract `frontend/src/app/modules/research/chart/` into `packages/research-chart`
  and consume it from the live Eval Lab app. The component already takes a dataset object and
  assumes nothing about its source, so this is a move plus an entry point.
- The chart renders published aggregates only. If a future dataset wants a per-run scatter,
  that is a new `level`, not a new data path.
