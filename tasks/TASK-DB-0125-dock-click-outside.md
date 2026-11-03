# TASK-DB-0125 — the chat panel closes on an outside click; a bigger home button

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0125-dock-click-outside` (from `main`) |
| **Status** | In review |

## Goal

The owner wanted the chat side panel to close when you click outside it, unless the click is on a button that opens the chat, and found the home button far too small to click.

## Done

- `CopilotDock`: while the panel is open, a pointer press outside it closes it. Presses on the dock (the panel, the pill, the call orb, the mobile strip), on any chat, or on a control marked `data-copilot-open` do not count as outside. The Contact page's "Ask the AI right now" and the project page's "Ask the copilot about X" are marked, so they keep working. New chat openers only need that attribute.
- The home logo is bigger (1.9 rem) with a clickable area at least 48 px tall (65 x 58 px measured, from about 30 x 25), and the nav links have a 42 px tall target. The logo now links to `/` instead of the `/lab` alias, and "Work" goes to `/#work`.

## Checks

- tsc and eslint pass. Local dev server, real clicks: the panel opens from the pill and closes on a click outside (the pill comes back); pressing "Ask the AI right now" with the panel closed opens it and it stays open with its answer.
