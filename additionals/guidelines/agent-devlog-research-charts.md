# Agent devlog — Research charts (do not break)

| Field | Value |
|-------|-------|
| **Document date** | 2026-09-24 |
| **Created** | 2026-09-24 |
| **Last updated** | 2026-09-24 |

**For Cursor agents.** Read this **before** any change to the research chart component, the
```chart fence spec, the static SVG pipeline, or `.rc-*` styles.

### Revision history

| Date | Notes |
|------|-------|
| 2026-09-24 | First version — TASK-DB-0054 (#49): generic chart component, spec, static SVG build step |

**In-repo pointers (so this doc is not missed):**

- `frontend/src/app/modules/research/chart/compute.ts` — header comment (the two structural rules)
- `frontend/src/app/modules/research/chart/ResearchChartSvg.tsx` — header comment (one render path, two colour modes)
- `frontend/src/styles/globals.css` — comment above the `--rc-*` token block
- `.cursor/rules/research-charts.mdc` — auto-attached when editing those files

**Canonical paths:**

| Piece | File |
|-------|------|
| Spec (what an author writes) | `frontend/src/app/modules/research/chart/spec.ts` |
| Numbers (the only place geometry is computed) | `frontend/src/app/modules/research/chart/compute.ts` |
| Marks (pure SVG) | `frontend/src/app/modules/research/chart/ResearchChartSvg.tsx` |
| Reader state | `frontend/src/app/modules/research/chart/ResearchChart.tsx` |
| Fence → embed | `frontend/src/app/modules/research/public/ResearchPaperPage.tsx` |
| Build step | `scripts/research-validate-charts.mjs` + `scripts/research/chart-pipeline.mjs` |
| Tests | `scripts/test-research-charts.mjs` (`pnpm test:research-charts`) |

**Test URLs:**

- Paper with the demo chart: http://localhost:5300/research/db-r-2026-010 (first free port from
  5300 — see the Vite log)

---

## The three rules that are not negotiable

The dataset behind the demo chart is a **blind set**. These are enforced in code and asserted in
tests, not just documented:

1. **No item-level or gold-label view.** The finest granularity the chart can emit is one row per
   arm per slice. `scripts/test-research-charts.mjs` pins the exact key set of a `ChartRow` (14
   keys) and a `ChartTableRow` (9 keys), and scans every row's entity blob for
   `/gold|expected_answer|item_?id|question_?id|label_?text/i`.
2. **No cross-entity arithmetic in the browser.** Rows are read straight out of
   `dataset.observations`, field for field. Nothing is averaged, pooled or re-derived. If an
   aggregate is wanted, the exporter publishes it in `aggregates` with a stated method.
3. **No free-text harness.** Structured metadata (thinking, max_tokens) is carried as fields.

If a change would make any of these expressible, stop — it is a data-model change, not a chart
change.

---

## What works (keep this pattern)

| Piece | Setting |
|-------|---------|
| Chart library | None. `d3-scale` + `d3-array` + `d3-format` only, and only in `compute.ts` / `ResearchChartSvg.tsx`. |
| One render path | `computeChartModel` is pure; `ResearchChartSvg` takes `colors` + `colorMode`. `css` mode emits `var(--rc-*)`; `light`/`dark` emit literal hexes for the static files. Never fork the SVG. |
| Static SVG | `chart/static.tsx` is the single esbuild entry for Node. Bundled (React included) so Node never resolves a bare specifier from a non-package dir. |
| Loading | `ResearchChartEmbed` shows the build-time SVG first, then `React.lazy`s the interactive chunk. If the chunk never arrives the static SVG stays — a chart, not a hole. |
| Layout | Horizontal above `STACKED_BREAKPOINT` (560). At or below it, the row stacks the label above the bar. **Labels are never rotated.** |
| Width | Measured with `ResizeObserver`, `Math.floor`ed. The SVG is drawn at exactly that width and CSS must not scale it, or the tooltip anchor lands somewhere else. |
| Tooltip | Hover on pointer devices, tap-to-pin on touch. A tooltip anchored to a row that just disappeared is cleared, not left floating. |
| Colours | `--rc-*` tokens on `.rc-chart` (light) and `.dark .rc-chart` (dark), in `globals.css`. |
| Facets | Every facet shares one x-scale, so bars are comparable across the grid. |
| Filenames | `chartSlug` = readable prefix + FNV-1a of the key-sorted canonical spec. Pure function of the spec, so Node and the browser agree with no build state. |

---

## What breaks it (avoid)

1. **Duplicating the palette.** The literal hexes in `chart/theme.ts` and the `--rc-*` block in
   `globals.css` must stay identical — a static SVG in an `<img>` cannot read CSS variables, so
   the duplication is deliberate. A test parses the CSS block and compares it to
   `CSS_TOKEN_SOURCE`. Change both, or the test fails (correctly).
2. **Computing a number in the browser.** Any mean, rate or delta that is not already in the
   dataset file is a violation of rule 2. `compute.ts` reads observations; it does not combine
   them.
3. **Adding a `level` that reaches per-record data.** New levels are fine (`runs` is one), but
   they must still bottom out at one row per arm per slice.
4. **Rotating labels.** Below 560px the row stacks instead. Rotated axis text is what this
   component exists to avoid.
5. **A second SVG builder.** If you find yourself string-concatenating SVG in a script, stop and
   re-export from `static.tsx` instead.
6. **Guessing a dataset path.** Resolve ids through `/research/data/index.json`
   (`datasetUrl()` in `chart/dataset.ts`). A basename guess breaks any dataset published under a
   subdirectory.
7. **Hardcoding eval-lab assumptions.** The component takes a dataset object and knows nothing
   about its source — phase 2 lifts this directory into `packages/research-chart` for the live
   Eval Lab app. `dataset.ts` is the only file allowed to know the `<id>.json` convention.

---

## The fence spec

````markdown
```chart
{
  "data": "eval-lab/judges-blind-760",
  "type": "dot-ci",
  "metric": "all_record_accuracy",
  "level": "summary",
  "highlight": ["ali_qwen38_flash_exp024", "kev_4b_exp027"],
  "caption": "…"
}
```
````

| Key | Meaning |
|-----|---------|
| `data` | Dataset id, resolved through `index.json`. Required. |
| `metric` | Measure key from the dataset's `measures`. Required. |
| `type` | `dot-ci` (default) or `bar`. Both draw the same 95% interval. |
| `level` | `summary` \| `breakdown` \| `experiments` \| `runs` \| `table`. Default `summary`. |
| `facet` | A **slice** dimension for `breakdown`, an **entity** dimension for `experiments`. Scope is enforced. |
| `filters` | Initial entity-dimension filters, e.g. `{"deployment": ["local"]}`. |
| `entities` | Explicit entity ids; overrides the level's default set. |
| `highlight` | Entity ids to call out; the rest are dimmed. |
| `colorBy` | Entity dimension the colour keys on. Default `deployment` when present. |
| `sort` | `value` \| `label` \| `none`. |
| `controls` | Array of `metric` \| `level` \| `filters` \| `download`, or `false` to hide the toolbar. |
| `caption` | Free text shown under the chart. |
| `height` | Plot height in px. Omit to let the row count decide. |

A spec carries **no numbers**. Every value the chart draws comes from the dataset file, so a
paper cannot drift from the export it cites.

`level` is facet-scoped on purpose: `breakdown` facets over a slice dimension (`mode`, task
source), `experiments` over an entity dimension (`experiment`). A slice facet key left in the
spec after switching to `experiments` is re-picked to the level's own default rather than
silently ungrouping the view.

---

## The build step

`pnpm research:validate-charts` (also in frontend `prebuild` and `predev`) does three jobs:

1. **Validates** every fence: parses, names a published dataset, and references a metric, level,
   facet, filter value, entity and highlight that the dataset actually contains.
2. **Verifies the data**: every synced file is hashed against the sha256 in `paper/data/index.json`.
3. **Renders the fallback**: light and dark SVGs at two widths (`wide` 720, `narrow` 420) into
   `frontend/public/research/charts/<paperId>/<slug>.<theme>[.narrow].svg`, plus
   `frontend/public/research/charts/manifest.json`.

`--check` verifies without writing and is a CI step, so a chart asset that has drifted from the
spec that produced it fails the build.

**Two datasets in the spec, one in the file** — `index.json`'s `commit` field is the exporter's
HEAD, **not** the commit carrying the exported files. The sha256 hashes are the effective pin;
both the sync script and the validator enforce them.

**Slug collisions** are a hard failure even though only a 32-bit hash collision can cause one:
a silent overwrite would publish the wrong figure.

---

## Checklist before merging chart changes

- [ ] `pnpm research:sync-data --check` passes (data matches the manifest)
- [ ] `pnpm research:gen-types --check` passes (types match the schema)
- [ ] `pnpm research:validate-charts --check` passes (fences valid, assets current)
- [ ] `pnpm test:research-charts` passes — especially the row-shape and field-for-field checks
- [ ] `pnpm lint` and `pnpm --dir frontend run typecheck` pass
- [ ] No new `--rc-*` variable is used without being declared (a test checks this)
- [ ] If the palette changed: `theme.ts` **and** the `--rc-*` block in `globals.css` both updated
- [ ] Checked the paper in **both** light and dark, at a desktop width and below 560px

---

## Related files

- `tasks/TASK-DB-0054-research-chart.md` — the task, the architecture table and the open threads
- `additionals/guidelines/agent-devlog-index.md` — master agent index
- `additionals/guidelines/agent-devlog-contract.md` — devlog + CodeGraph workflow
- `additionals/guidelines/agent-devlog-mermaid.md` — the other markdown-fence renderer in this repo
