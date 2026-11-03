
## Update: routine folders (prompt-library format)
- `backend/src/copilot/skills/<open|latest|tech|role>/`: `meta.yaml` (name, version, description for the model, when it applies, created_by model, tested_on), `CHANGELOG.md`, `examples/inputs/cases.json` (real utterances with the expected routine and path). `scripts/test-copilot-router.mjs` runs every folder's cases as regression tests. Format follows pukujan-lab-2/prompt-library `AGENTS.md`; nothing copied. Tiny routines would stay in code only.
- `open` and `latest` return `captions` (three human-paced bubble lines per journey, several wordings each). They are not sent to the browser yet: wiring them to `agentCursor.say` waits for the cite-a-section PR, and `route.ts` stays untouched here to avoid a conflict.
