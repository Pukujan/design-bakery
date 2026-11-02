# TASK-DB-0115 — the hero thread folds away when the chat loses focus

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0115-hero-thread-collapse` (from `main`) |
| **Status** | In review |

## Goal

The hero chat kept its whole conversation open above the composer long after the visitor had moved on. The owner wanted it to close when the chat is no longer in focus, with a state separate from the side panel's.

## Done

- The hero thread is open only while the visitor is working in it: the composer or something inside the chat has focus, or a reply is still arriving, and the hero is on screen. A click elsewhere, tabbing away or scrolling the hero off screen folds it away (height and opacity ease out). Focusing the composer opens it again.
- The conversation stays in the shared store, so the side panel always has all of it. Only what the hero shows is separate; the side panel's thread is unchanged.

## Checks

- tsc and eslint pass. Local dev server, real clicks: clicking the composer opens the thread of an earlier conversation; clicking empty space folds it away.
