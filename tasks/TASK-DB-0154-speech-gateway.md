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

**Next.** Merge, check the deploy rebuilt `design-bakery-voice` with the gateway URL, then a scripted call (`scenarios.py`) and the gateway log line `call <room> (design-bakery)`.
