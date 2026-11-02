# TASK-DB-0106 — Contact pulsar to the top right on wide screens

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0106-contact-pulsar-right` (from `main`) |
| **Status** | In review |

## Goal

On wide screens the pulsar's bright core sat on top of the small line "Free 30-minute video consultations", and Pretext pushed the "Talk to me." title far to the right.

## Done

- `buildPulsar` anchors the pulsar top right when the screen is wider than tall (top left on phones, where the heading sits below it). The line is readable and the title stays on the left edge.

## Checks

- tsc passes. Local dev server at a wide window: `/contact` shows the line and the title on the left, the pulsar on the right.
