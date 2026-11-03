# TASK-DB-0124 — every button question is answered from saved answers

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0124-instant-button-answers` (from `main`) |
| **Status** | In review |

## Goal

The Contact page's "Ask the AI right now" sent "How can you help with product design?" to the live model, which answered with unchecked claims. The owner expected button questions to get saved answers.

## Found

Every question a button sends was checked against the instant answers. Not instant: the four "How can you help with <area>?" questions and "What do you build?". "Which project used OCR?" was answered by the generic projects intent, which does not answer an OCR question.

## Done

- New instant answer per consulting area (AI engineering, product design, marketing, full-stack development): "I offer free 30-minute consultations on <area>. Tell me what you are working on and pick a time, and I will come with ideas", with chips to the related projects and the booking link. The project-to-area pairing is a fixed list in `answers.ts`.
- "What do you build?" and "What do you make?" now match the identity answer.
- The chat box's sample question "Which project used OCR?" is replaced by "Show me your projects".
- The built-in fallback in the page has the same area answer.
- `test-copilot-answers.mjs` asserts all eleven button questions are answered from the cache.

## Not done

- Free typing in the chat box still reaches the model when no saved answer matches, by design.
- Moving the saved wording into an Octo table is still an option (see TASK-DB-0122).
