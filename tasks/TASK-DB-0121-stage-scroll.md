# TASK-DB-0121 — scroll to top on every page change, and chip scrolls that land

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0121-fix-anchor-links` (from `main`) |
| **Status** | In review |

## Goal

The copilot's "Work history" chip scrolled partway and stopped, and opening another page (for example "Next project") kept the old scroll position. The owner wanted every page to scroll to the top, smoothly, when opened.

## Cause

The browser's own smooth `scrollIntoView` fights Lenis, which now drives scrolling on every stage page (TASK-DB-0116), and it stops early. Measured: the chip scrolled to 746 px when the section was at 6738 px.

## Done

- `lab/stageScroll.ts`: every script-driven scroll goes through Lenis (`scrollStageToElement`, `scrollStageToTop`), falling back to the browser's scroll when Lenis is off (reduced motion, touch).
- The copilot chips (`copilot.go`) and the contents lists in articles and research papers use it. The chip now lands exactly on the section (measured: section top at 0 px).
- `LabStage` scrolls to the top, smoothly, whenever the page path changes. A `#section` link or a query-only change on the same page leaves the scroll alone. Measured on a click from the bottom of the home to `/blogs`: 6738 px to 0 within about 1 s.

## Checks

- tsc and eslint pass; the measurements above come from the local dev server.
