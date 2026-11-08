# TASK-DB-0154: Live call speech through the shared speech gateway

Issue: [#241](https://github.com/Pukujan/design-bakery/issues/241) (leaf; parent: none; dependencies: none in this repo).

**Goal.** The site's live call worker (`design-bakery-voice`) reached the Pro's speech server straight through the VPS's socat tunnel `copilot-speech-bridge` (`host.docker.internal:18799`), which is being removed. Every project's speech now goes through the shared speech gateway on the VPS (Komodo stack `speech-gateway`, `host.docker.internal:18800`; pukujan-lab-2/voice-agent-research `docs/speech-gateway.md`). Move the call onto it.

**Done.**
- `deploy/vps/docker-compose.yml` `voice`: `SPEECH_URL` defaults to `http://host.docker.internal:18800`, `SPEECH_PROJECT=design-bakery` (overridable with `VOICE_SPEECH_URL` / `VOICE_SPEECH_PROJECT` in `.env`).
- `voice-agent/agent.py`: the call's `aiohttp` session sends `X-Speech-Project: design-bakery` and `X-Speech-Call: <room>` on every `/health`, `/stt`, `/tts` and `/load`; a shutdown callback posts `/release` (errors ignored) before the session is closed. A 503 `no_room` goes down the existing speech error path: no cloud fallback.
- `voice-agent/scenarios.py`: the echo TTS names the project.
- Docs: `docs/self-hosting.md` §5, `voice-agent/README.md` "On the VPS", one line in `AGENTS.md` on where speech routing is changed.

**Evidence (before merge).**
- Worker unit tests: 14 pass (`python -m unittest discover -s voice-agent/tests`).
- Against a fake speech server, one call's session sent `/health`, `/load` and `/release`, each with `X-Speech-Project: design-bakery` and `X-Speech-Call: db-call-test`; a release on a closed session raised nothing.
- `docker compose --profile voice config` shows `SPEECH_URL: http://host.docker.internal:18800`, `SPEECH_PROJECT: design-bakery`.

**After #242 merged (31af5ab, 2026-11-08).**
- The Komodo deploy rebuilt the worker: `design-bakery-voice:31af5ab385e5-20261108T144014Z`, `SPEECH_URL=http://host.docker.internal:18800`, `SPEECH_PROJECT=design-bakery`, registered with LiveKit at 14:40:59 UTC.
- Scripted call `scenarios.py --only 1,2,3,5,7` against www.design-bakery.com: 5 of 5 right, room `db-call-5c6482ba`. The gateway logged `call db-call-5c6482ba (design-bakery) english-fast -> pro`.
- Reply speed (Phoenix `voice.turn`, answered turns, caller stopped to voice started): before the move (room `db-call-557ea0ae`, same script, minutes earlier) 2472 / 2386 / 2524 ms; through the gateway 2606 / 2468 / 2451 ms. Speech-to-text 396 to 771 ms before, 536 to 588 ms after; first audio 146 to 243 ms before, 148 to 282 ms after. No meaningful change.
- **Bug found:** the call's place was not released when the call ended (still listed in the gateway's `/health` after the job shut down). LiveKit 1.8.8 runs shutdown callbacks at the same time (`asyncio.gather` in `ipc/job_proc_lazy_main.py`), so `http.close` closed the session under the release. A `/release` posted from inside the container worked (`{"ok": true, "calls": 0}`).
- Fix (this follow-up): one callback releases and then closes. Against a fake server the old pair sent no release; the new callback sent it with the call's header.

**After the fix merged (#243, 8980318, 2026-11-08).**
- Deployed by Komodo: `design-bakery-voice:8980318ffb28-20261108T144909Z`, gateway URL and project unchanged, registered at 14:50:00 UTC.
- Scripted call (same script): 5 of 5 right, room `db-call-42e62b67`; the gateway logged `call db-call-42e62b67 (design-bakery) english-fast -> pro`, and once the job shut down the call was gone from the gateway's `/health` (only another project's call was left on the Pro).
- Turns: 3418 / 2222 / 1972 ms; speech-to-text 325 to 516 ms, first audio 43 to 225 ms. The slow first turn was the model's decision (2410 ms), not speech.

**Done.** Nothing left in this repo. Outside it, for the coordinator: the `copilot-speech-bridge` socat on 18799 is no longer used by this worker. routes.toml has no `[project.design-bakery]` block, so the gateway's defaults apply to these calls (the copilot's block says `wait`); a block is the owner's call.

### 2026-11-08 14:35:19 UTC — claude-opus-5.5

<!-- continuity:checkpoint {"agent":"claude-opus-5.5","blocked":[],"changed":["deploy/vps/docker-compose.yml, voice-agent/agent.py, voice-agent/scenarios.py, docs/self-hosting.md, voice-agent/README.md, AGENTS.md"],"completed":["Speech for the live call goes through the shared speech gateway: compose default, project and call headers, release on call end, docs"],"decisions":["no new decisions"],"evidence":["14 worker unit tests pass; fake speech server saw /health, /load, /release with both headers; compose config shows the gateway URL"],"next_action":"Open the PR, merge on green, check the deploy rebuilt design-bakery-voice, then a scripted call through the gateway","protocol_version":"0.1.0-draft","schema":"project-continuity.checkpoint.v1","task_id":"DB-0154","timestamp":"2026-11-08T14:35:19Z"} -->
<!-- continuity:checkpoint-operation {"payload_sha256":"5525bbb5144c3bc6889e76aacb1877d7f9c133ba3dbb617dc6cf762329fe21e6","request_id":"9dd0242f667f4d469389b9e57420b2bf","schema":"project-continuity.checkpoint-operation.v1","task_id":"DB-0154"} -->

Completed:
- Speech for the live call goes through the shared speech gateway: compose default, project and call headers, release on call end, docs

Evidence:
- 14 worker unit tests pass; fake speech server saw /health, /load, /release with both headers; compose config shows the gateway URL

Decisions:
- no new decisions

Changed:
- deploy/vps/docker-compose.yml, voice-agent/agent.py, voice-agent/scenarios.py, docs/self-hosting.md, voice-agent/README.md, AGENTS.md

Blocked/uncertain:
- none

Next:
- Open the PR, merge on green, check the deploy rebuilt design-bakery-voice, then a scripted call through the gateway

### 2026-11-08 14:44:17 UTC — claude-opus-5.5

<!-- continuity:checkpoint {"agent":"claude-opus-5.5","blocked":[],"changed":["voice-agent/agent.py"],"completed":["Moved the call onto the gateway (#242, 31af5ab, deployed, scripted call 5 of 5, gateway logged the call); found the release raced http.close"],"decisions":["no new decisions"],"evidence":["Gateway still listed db-call-5c6482ba after job shutdown; LiveKit gathers shutdown callbacks; fake-server repro: old pair sent no release, new callback did"],"next_action":"Merge the fix, check the rebuilt worker, scripted call whose place frees when it ends","protocol_version":"0.1.0-draft","schema":"project-continuity.checkpoint.v1","task_id":"DB-0154","timestamp":"2026-11-08T14:44:17Z"} -->
<!-- continuity:checkpoint-operation {"payload_sha256":"d44f56ad3a2fbc858ad573a91e70199f6112ce8cb8e749f62b58a8960ff9f096","request_id":"f6cfd091822e4aa38cc4a2fb8bf650bb","schema":"project-continuity.checkpoint-operation.v1","task_id":"DB-0154"} -->

Completed:
- Moved the call onto the gateway (#242, 31af5ab, deployed, scripted call 5 of 5, gateway logged the call); found the release raced http.close

Evidence:
- Gateway still listed db-call-5c6482ba after job shutdown; LiveKit gathers shutdown callbacks; fake-server repro: old pair sent no release, new callback did

Decisions:
- no new decisions

Changed:
- voice-agent/agent.py

Blocked/uncertain:
- none

Next:
- Merge the fix, check the rebuilt worker, scripted call whose place frees when it ends

### 2026-11-08 14:52:26 UTC — claude-opus-5.5

<!-- continuity:checkpoint {"agent":"claude-opus-5.5","blocked":[],"changed":["none"],"completed":["Call speech on the gateway (#242) and the release fix (#243) merged and deployed; scripted call 5 of 5, gateway logged it and freed its place"],"decisions":["no new decisions"],"evidence":["design-bakery-voice:8980318ffb28-20261108T144909Z with SPEECH_URL :18800; gateway log call db-call-42e62b67 (design-bakery); /health empty of it after shutdown"],"next_action":"None in this repo; coordinator removes the socat bridge","protocol_version":"0.1.0-draft","schema":"project-continuity.checkpoint.v1","task_id":"DB-0154","timestamp":"2026-11-08T14:52:26Z"} -->
<!-- continuity:checkpoint-operation {"payload_sha256":"e4f530e654f262999ffc99045e8cb99a5873b64a60afe7fb00876cb54a4c1d75","request_id":"be0733cbbf47425ab4f38ed0352307de","schema":"project-continuity.checkpoint-operation.v1","task_id":"DB-0154"} -->

Completed:
- Call speech on the gateway (#242) and the release fix (#243) merged and deployed; scripted call 5 of 5, gateway logged it and freed its place

Evidence:
- design-bakery-voice:8980318ffb28-20261108T144909Z with SPEECH_URL :18800; gateway log call db-call-42e62b67 (design-bakery); /health empty of it after shutdown

Decisions:
- no new decisions

Changed:
- none

Blocked/uncertain:
- none

Next:
- None in this repo; coordinator removes the socat bridge
