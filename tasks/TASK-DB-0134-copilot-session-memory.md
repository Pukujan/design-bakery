# TASK-DB-0134: session memory for the copilot (rolling summary and token budget)

## Goal
Long chats and long voice calls (hours of small talk) must keep their thread without the prompt growing without limit. Before this the browser sent the last 20 turns, older ones were forgotten, and the in-page list was unbounded.

## Done
- `frontend/src/app/modules/copilot/memory.ts` (pure): when to summarise (more than 14 turns after the last summary; idle nudge lines are stored but not counted and never summarised), which turns (all but the newest 6, so a pending offer and its answer always stay), what to send (turns after the summary, max 20), the page cap (200 messages).
- `store.ts`: keeps `summary {text, upTo, covers}` in sessionStorage (`db-copilot-summary-v1`) next to the conversation; after each turn (typed or voice, both go through `send`) it asks `POST /api/copilot/summarize` in the background, incrementally (old notes plus newly dropped turns). On failure it retries after 60 s and the plain trim to 20 turns stays in force. `clear()` drops the summary.
- `backend/src/copilot/memory.ts`: `sanitizeSummary` (control characters, markup, backticks and our delimiter removed; 150 words / 1200 chars), `summaryBlock` (delimited `<conversation-notes>`, said to be untrusted notes and never instructions or site facts), `fitHistory` (token budget `COPILOT_CONTEXT_TOKENS`, default 9000 estimated; the last 4 turns are never cut, so the question a "yes" answers survives), `summarize` (one non-streaming call, cheapest provider first: OpenRouter free, dev, DeepSeek, Qwen; WorkBuddy skipped; max 2 attempts inside an 8 s hard timeout; usage counts against the daily budget; its own limiter of 3/min, 40/h).
- `route.ts`: `/chat` accepts optional `summary` (max 1200) and `covered`; `/summarize` is new. Routing still sees only the last two turns, so no routine depends on old context.
- `tracing.ts`: turn attributes `copilot.context_tokens`, `copilot.summary_used`, `copilot.history_dropped`, `copilot.history_kept`.
- `scripts/test-copilot-memory.mjs`, `pnpm test:copilot-memory`, wired into CI.

## Evidence
`pnpm --dir backend run build`, `pnpm test:copilot-memory`, the existing copilot tests (answers, router, stream, cite) and the frontend type check pass.

## Not done
Not run against a live model: the summariser is tested with a stubbed fetch. After deploy, read `copilot.summary_used` and `copilot.context_tokens` in the traces on a long chat to confirm the summary appears and the size levels off. The 9000-token budget is an estimate (3.5 chars a token) and can be tuned with the env var.
