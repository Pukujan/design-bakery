# TASK-DB-0121 — copilot: booking on /contact stalls, blank replies, greeting resets

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0121-copilot-booking-flow` (from `main`) |
| **Status** | In review |

## Goal

The owner's screenshot of AI Pujan on `/contact`: the visitor chose AI engineering and said "ok" to the 30-minute call, but the copilot asked what to talk about again. "anything regarding ai" then got a blank bubble, and "hello??" got the canned introduction, which dropped the booking thread.

## Done

- `book_call` and the system prompt: once the area is known, a yes or any topic is enough to book. A topic is optional, and the model never asks the same question twice.
- `route.ts`: a turn that ends with no text and no action now sends "Sorry, I lost my answer there. Could you say that again?", logs `[copilot] empty turn`, and marks the trace as an error.
- Instant answers: a reply to a question the copilot just asked always goes to the model. A greeting after the first turn is never answered from the cache.

## Checks

- `pnpm --dir backend run build`, `pnpm run test:copilot-answers` (now covers "hello??" and "hi" as follow-ups), and `pnpm run test:copilot-stream` all pass.
- Not checked: traces for the original conversation (gravebuster was unreachable over SSH, and the trace-read key lives there), and a live-model run of the booking flow.

## Next step

After deploy, rerun the flow on `/contact` and look for any `[copilot] empty turn` lines or error traces. If they come from the 240-token output cap, raise it.
