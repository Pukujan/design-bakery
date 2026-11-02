# TASK-DB-0104 — limit Pretext on the writing and research lists

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0104-lists-limit-flow` (from `main` @ `c697751`) |
| **Status** | In review |

## Goal

The owner found the writing (blog) list unusable: every title and excerpt flowed around the sky body and broke into ragged lines.

## Done

- `/blogs` and `/research`: row titles and excerpts are plain text. The page heading ("Notes from building it.", "Working papers.") keeps Pretext, so the effect stays where it is a single short line.

## Checks

- tsc passes. Local dev server: `/blogs` rows align and read cleanly with the body behind them.
