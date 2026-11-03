
## Update: routine folders (prompt-library format)
- `backend/src/copilot/skills/<open|latest|tech|role>/`: `meta.yaml` (name, version, description for the model, when it applies, created_by model, tested_on), `CHANGELOG.md`, `examples/inputs/cases.json` (real utterances with the expected routine and path). `scripts/test-copilot-router.mjs` runs every folder's cases as regression tests. Format follows pukujan-lab-2/prompt-library `AGENTS.md`; nothing copied. Tiny routines would stay in code only.
- `open` and `latest` return `captions` (three human-paced bubble lines per journey, several wordings each). They are not sent to the browser yet: wiring them to `agentCursor.say` waits for the cite-a-section PR, and `route.ts` stays untouched here to avoid a conflict.

## Update: answering "yes" to an idle offer
- Frontend: a nudge line that plays on a quiet call is recorded in the conversation as an assistant message (`copilot.noteSaid`, called from `voice.ts` for lines `holdAudio.isNudge` accepts; the muted notice is not recorded; a newer nudge replaces an older unanswered one). `store.ts` change is one optional field and one method.
- Backend: `routeRequest(question, firstTurn, voice, previous)` reads the last assistant message. If it is a known offer (`OFFERS` in `routines.ts`) a bare yes runs the saved request (projects offer: projects answer, moves to /#work; consultation offer: booking answer, opens /contact; both with captions), an open-ended line gets "what would you like to know", and no / not now / maybe later gets a kind line with no action. Anything else, or no known offer in view, goes on as before (so "yes" with no offer reaches the model). `route.ts` changed by one argument.
- Tests: `skills/offer/examples/inputs/cases.json` (yes, no, ambiguous, no offer), plus a drift guard that reads `holdAudio.ts` and fails if a nudge line is missing from `OFFERS`.
- Vercel check on #188 failed with "Deployment rate limited, retry in 24 hours" (Vercel plan limit), not a code failure.
- Not checked on a real call.
