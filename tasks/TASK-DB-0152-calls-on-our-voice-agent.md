# TASK-DB-0152: Live calls on this repo's voice worker

**Goal.** The owner wants the site's live calls answered by this repo's `voice-agent/` (forked in TASK-DB-0137), not the copilot lab's worker. The lab's worker is in another repo, which this work must not touch.

**Found.** `voice-agent/` was never deployed. `.env.api` on the VPS has no `VOICE_LIVEKIT_*`, so `/api/copilot/voice` asked the lab for a token and the lab's worker answered every call. A scripted call against the live site (`voice-agent/scenarios.py --only 1,3,5`) worked on that path: 3 of 3 lines answered.

**Done.**
- `deploy/vps/docker-compose.yml`: a `voice` service (profile `voice`, so Komodo's plain `compose up` skips it). It builds `voice-agent/`, joins `copilot_default` to reach `copilot-livekit:7880`, and reaches the Pro's speech server through the host tunnel `host.docker.internal:18799`. Secrets come from `deploy/vps/.env.voice` (`.env.voice.example`, git-ignored).
- `deploy/vps/deploy.sh`: once `.env.voice` exists (or `--with-voice`), the worker is built and swapped last, after web and API are live. It must log `registered worker` within `VOICE_TIMEOUT` (120 s), or the previous worker image goes back. It never fails the deploy. Its tag is kept in `.env` (`DESIGN_BAKERY_VOICE_IMAGE`).
- Docs: `docs/self-hosting.md` §5 (how to switch over and back), `voice-agent/README.md` "On the VPS".

**Evidence.**
- `docker compose config --services` lists web and api only, and `voice` only with `--profile voice`; `up --dry-run --no-deps web` works without the `copilot_default` network.
- `bash -n deploy/vps/deploy.sh`; `--help` shows the new flags.
- The image built on the VPS with buildx (2.0 GB). Run there as `design-bakery-voice-check` on `copilot_default`, it logged `registered worker` against `ws://copilot-livekit:7880`.
- A scripted call through it (local API minting tokens for that name, `scenarios.py --only 1,2,3,5,7`) passed 5 of 5: three caller lines answered, the roommate dropped (voice match 0.25), "Hey Campos…" not answered. The worker logged `hush on | voice match on` and took the job for room `db-call-…`. The test container and image were removed afterwards.

**Next.** After merge, on the VPS: create `.env.voice`, let Komodo deploy, and check that the worker registered. Then add `VOICE_LIVEKIT_KEY` / `VOICE_LIVEKIT_SECRET` to `.env.api`, deploy again, and run a scripted call against the live site. Then RAG on call turns (PR #205).
