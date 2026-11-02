# TASK-DB-0102 — hero copilot: simpler intro, calmer call button, better prompt rail

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0102-hero-copilot-copy` (branched from `main` @ `8f55b9a`) |
| **Status** | In review |

## Goal

The owner's review of the live hero: the intro, the chips and the call button looked bad. They asked for a bare hero where the box itself expands to show sample questions and autocomplete.

## Done

- No intro line and no chips above the composer. The hero shows only the box.
- Focusing the box before the first message opens a second line inside it: four sample questions while it is empty, then the two closest matches as the visitor types (every typed word must appear; Tab fills the top match). Clicking one sends it. Questions come from `SUGGESTIONS` in `copilotAnswers.ts`.
- Call control: a quiet outlined pill with a mic icon and the label "Voice call". Removed the gradient orb and the wave animation (`.vo-call`, `.vo-call-wave`).

## Checks

- `pnpm exec tsc --noEmit` (frontend): passes.
- `pnpm exec eslint` on the changed files: passes.
- `pnpm run test:copilot-answers`: passes.
- Local dev server: focusing the box shows the four samples; typing "what" narrows them to two.

- Removed the hero consultation row (the "live consultation with my AI" typing button and the "Book a free consultation" link). Its components (`ConsultCta.tsx`, `consult-cta.css`) had no other users, so they are deleted; they are in git history.

## Not changed

- The `not live` honesty label. It is gone from the intro; the copy now says "AI Pujan". Check this against the owner's #147 requirement that the site make clear it is virtual.

## Next step

Owner review of the PR on the live preview, then merge.
