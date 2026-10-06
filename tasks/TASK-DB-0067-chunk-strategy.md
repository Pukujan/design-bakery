# TASK-DB-0067 — vendor chunk strategy (stacked on TASK-DB-0066)

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#78](https://github.com/Pukujan/design-bakery/issues/78) (remaining modular restructuring) |
| **Branch** | `task/TASK-DB-0067-chunk-strategy` — **stacked on `task/TASK-DB-0066-route-code-splitting`** (PR [#77](https://github.com/Pukujan/design-bakery/pull/77)) |
| **Status** | Complete — verified in a browser; stacked PR open. |

## Goal

Give `react*` a stable chunk hash so returning visitors do not re-download the framework on every deploy. This is observation 4 of issue #78 (the chunk graph after route splitting).

## Scope

- `frontend/vite.config.ts` only: add `build.rollupOptions.output.manualChunks`.

## Done

- `frontend/vite.config.ts`: `manualChunks` puts `react`, `react-dom`, `react-router`, `react-router-dom` and `scheduler` into a `vendor-react` chunk.

## Evidence

- Entry JS: **710.45 → 527.16 kB**; new `vendor-react` chunk **182.62 kB**. Total is unchanged (≈710 kB) — this is a **caching** change, not a size reduction. The win is that `vendor-react`'s hash stays stable across app deploys.
- Mermaid's per-diagram-type chunks (cytoscape, katex, wardley, sequenceDiagram, …) remain separate — 5 of them, confirmed present after the build.
- Browser check (Playwright/Chromium against the built `dist`): `/`, `/blogs/8` (17 diagrams render), `/research/papers/db-r-2026-010`, `/case-studies/invest-ai` and a 404 all render with **no page errors**.
- `pnpm lint` and `pnpm run build` pass.

## Rejected — do not add a mermaid rule

Forcing `mermaid` into its own `manualChunks` entry was tried and **reverted**: it produced a single **2,746.62 kB `vendor-mermaid` chunk**, because it collapsed mermaid's own per-diagram-type dynamic imports (cytoscape 432 kB, katex 252 kB, wardley 483 kB, …) into one blob that every diagram page would download. Mermaid already manages its own code-splitting; leave it alone. The rule is commented as such in `vite.config.ts` so it is not "helpfully" re-added.

## Note on stacking

This branch is cut from the route-splitting branch, not `main`: the chunk graph it tunes only exists once the routes are split. Merge PR #77 first, then this one.

## Next step

The case-study dedup (issue #78, step 5a). Reconnaissance done: the four `frontend/extras/*/src/app/components/ui` trees are **byte-identical** (48 components, 0 diff lines), so the JS side is mechanical — but each case study's Tailwind config is `@import 'tailwindcss' source(none); @source '../**/*.{js,ts,jsx,tsx}'`, so moving the tree out of a case study's own directory silently drops the shared components' classes from that case study's CSS. Each of the four needs its `@source` updated and its page re-verified visually.
