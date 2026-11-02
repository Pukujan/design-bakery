# TASK-DB-0119 — list pages: text flows only round the middle of the star

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0119-list-flow-center-only` (from `main`) |
| **Status** | In review |

## Goal

The owner found Pretext on the writing and research lists still buggy and wanted it limited to the star's centre.

## Done

- On `/blogs` and `/research` the flow obstacle keeps 45% of the body's flow radius (`COMPACT_FLOW` in `LabBackdrop.tsx`), on top of the 40% body size, so only rows that cross the middle of the star bend. Every other row stays straight.

## Checks

- tsc and eslint pass. Local dev server, `/blogs` scrolled to the star: the one row beside the star bends round it; the rows above and below are straight.
