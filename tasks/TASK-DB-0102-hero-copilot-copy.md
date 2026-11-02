# TASK-DB-0102 — hero copilot: simpler intro, calmer call button, better prompt rail

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0102-hero-copilot-copy` (branched from `main` @ `8f55b9a`) |
| **Status** | In review |

## Goal

The owner's review of the live hero: the intro was too long, the Call button looked harsh, and the suggestion chips were cramped and cut off. They asked for the intro to read "Hey, it's AI Pujan. You can talk to me here, or even start a voice call", a calmer call control, and a better set of prompts with a bounded right-hand scroll.

## Done

- Intro is one line. The "Virtual Pujan · not live" label and the long disclaimer are removed.
- Prompt chips: Who are you? · Experiences · Consultation · My AI builds · Give me a tour · Which project used OCR? · What is Cortex? Each chip sends a question the answer engine matches (`SUGGESTIONS` in `copilotAnswers.ts`).
- Prompt rail: horizontal, snaps to chips, fades at the right edge, and stops after seven chips.
- Call control: a quiet outlined pill with a mic icon and the label "Voice call". Removed the gradient orb and the wave animation (`.vo-call`, `.vo-call-wave`).

## Checks

- `pnpm exec tsc --noEmit` (frontend): passes.
- `pnpm exec eslint` on the changed files: passes.
- `pnpm run test:copilot-answers`: passes.
- Local dev server, desktop and 375px: the intro, the rail and the Voice call pill render; "Consultation" returns the consultation answer.

## Not changed

- The "live consultation with my AI" typing button and "Book a free consultation" button above the intro (`ConsultCta`).
- The `not live` honesty label. It is gone from the intro; the copy now says "AI Pujan". Check this against the owner's #147 requirement that the site make clear it is virtual.

## Next step

Owner review of the PR on the live preview, then merge.
