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

**Next.** Merge the fix, check the rebuilt worker, and a scripted call whose place is gone from the gateway's `/health` once it ends.

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
