# TASK-DB-0164: A failed call says where it failed

**Goal.** The owner reported the site's voice call "keeps failing" (2026-11-14). The server side was healthy (pass, token, LiveKit, worker and gateway all answered), LiveKit had logged no browser session since 2026-11-10 04:35 UTC, and the failing calls' logs were gone after a redeploy. The page showed one generic message and reported nothing, so the cause could not be found.

**Done.**
- `voice.ts` `start()` tracks its step (`load`, `mic`, `grant`, `connect`, `publish`) and, on failure, the 60 s no-agent timeout (`agent`) or a drop before the agent answered (`dropped`), calls `reportVoiceFailure` (store.ts) with the step, the browser's error name and message, and the HTTP status for a grant error.
- API `POST /api/copilot/voice/failed` (route.ts): validated, no pass needed, limited per address, no visitor text. It logs `[voice] call failed at <step>: …` with the user agent and writes a `voice.start_failed` span to Phoenix (`recordEvent` in tracing.ts).
- `POST /api/copilot/voice` now logs its 401, 429 and 503 refusals.

**Next.** After the owner's next failed call: `ssh vps docker logs design-bakery-api 2>&1 | grep '\[voice\]'`, or the `voice.start_failed` spans in Phoenix.
