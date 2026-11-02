# TASK-DB-0104 — smaller sky body on the writing and research lists

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0104-lists-limit-flow` (from `main` @ `c697751`) |
| **Status** | In review |

## Goal

The owner found the writing (blog) list unusable: every title and excerpt flowed around the sky body and broke into ragged lines.

## Done

- Row titles and excerpts on `/blogs` and `/research` keep Pretext. The sky body on those two pages is drawn at 50% size (`compact` on `LabBackdrop`, `COMPACT_SCALE`), and the flow obstacle shrinks with it, so only the rows next to it move.
- First attempt (plain rows) was rejected by the owner and replaced.

## Checks

- tsc passes. Local dev server: `/blogs` rows far from the body sit straight; the ones beside it flow round the smaller body.

## Tune

`COMPACT_SCALE` in `LabBackdrop.tsx` is the one number to change.
