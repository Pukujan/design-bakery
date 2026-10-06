# TASK-DB-0063 — remove the unused dependencies (modularization steps 1 and 4)

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#73](https://github.com/Pukujan/design-bakery/issues/73) (modular restructuring) |
| **Branch** | `task/TASK-DB-0063-remove-unused-deps` |
| **Status** | Complete — steps 1 and 4 landed, verified green; PR open. |

## Goal

Land the smallest useful slice of the modularization plan ([`additionals/doc/modularization-plan.md`](../additionals/doc/modularization-plan.md), issue #73): remove dependencies nothing imports, so installs shrink without touching app behaviour.

## Scope

- **Step 1** — drop `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` (zero imports in `frontend/src` and `frontend/extras`).
- **Step 4** — drop `date-fns` and `react-day-picker` and delete the five unused `components/ui/calendar.tsx` copies (nothing imports them).

Out of scope here (separate steps): lazy-loading `mermaid` (step 3), the case-study workspace package (step 5), and moving the 38.4 MB video (step 7).

## Done

- `frontend/package.json`: the six dependencies removed.
- `frontend/src/app/components/ui/calendar.tsx` and the four copies under `frontend/extras/*/src/app/components/ui/calendar.tsx` deleted.
- `pnpm-lock.yaml` updated by `pnpm install`.

## Evidence

Measured 2026-10-05 on this branch, Windows 11 / Node 24 / pnpm 10.32.1.

- `pnpm install` after the edit: **`Packages: -46`** (46 packages removed from the graph).
- `pnpm-lock.yaml` no longer resolves any `@mui/*`, `@emotion/react`, `@emotion/styled`, `date-fns`, or `react-day-picker` entry. The only surviving `@emotion/*` entries are `@emotion/is-prop-valid` and `@emotion/memoize` — optional transitive deps of `motion`/`framer-motion`, not of the removed packages.
- `node_modules/.pnpm` still held **12 stale orphan dirs (48.0 MB)** plus **9 `@emotion/*` orphans (0.5 MB)** left over from the prior install — pnpm does not garbage-collect virtual-store dirs for packages dropped from the graph. Verified orphaned (no top-level `node_modules/@mui` or `@emotion` symlink, no `package.json` declaring them, no lockfile entry, `pnpm why` empty) and removed: **≈48.5 MB reclaimed** in this working copy. A fresh clone/install never creates them.
- Correction to the plan's estimate: `@mui/icons-material`'s virtual-store dir is **18.4 MB**, not the ≈90 MB stated in `modularization-plan.md`.
- Bundle is unchanged: `dist/assets/index-Dw-f6_lE.js` is still **3,412.59 kB**. MUI/emotion were declared but never imported, so they were never in the bundle — the gain here is install/disk, not first-paint. First-paint gains come from step 3.
- `pnpm lint`, `pnpm --dir frontend run typecheck`, and `pnpm run build` all pass.

## Next step

Step 3 — lazy-load `MermaidDiagram` and the heavy routes so `mermaid` leaves the 3.4 MB entry chunk.
