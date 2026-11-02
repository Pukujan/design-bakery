# TASK-DB-0116 — smooth scroll and the custom cursor on every stage page

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0116-shared-scroll-cursor` (from `main`) |
| **Status** | In review |

## Goal

The home page scrolled smoothly and had the accent-dot cursor; every other page used the browser's plain scroll and cursor. The owner wanted the home's behaviour everywhere.

## Done

- Lenis smooth scrolling and `LabCursor` moved from `LabHome` into `LabStage`, the frame shared by `/`, `/work/*`, `/contact`, `/blogs` and `/research`, so every page has them. Reduced motion and touch devices still skip both.
- `.lab-has-cursor` now sits on `.lab-stage` (it used to be on each page's `.lab-root`).

## Checks

- tsc and eslint pass. Local dev server on `/blogs`: the page has the `lenis` class, the cursor element and `.lab-stage.lab-has-cursor`.
