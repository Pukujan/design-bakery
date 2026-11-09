# TASK-DB-0160: Songs from the owner's Flow Music plan

**Goal.** The copilot can make a short song on request, in chat and on a call, on the owner's paid Flow Music plan (www.flowmusic.app). It always asks what kind of song first, saves every song so a repeat costs nothing, and plays it when it is ready. The owner asked that Chrome not stay running: it starts cold for each song and closes after.

**Plan.**
1. `music-agent/`: a small always-on HTTP server; Google Chrome (started by hand, no automation flags, Playwright over CDP) runs only for one job, in Xvfb, with its profile on the `music-data` volume. A sign-in window with a remote screen (noVNC on the VPS loopback) for the owner. Deploy step in `deploy.sh`. **(this PR)**
2. After the owner signs in: map Flow Music's song page (`flow.mjs` `makeSong`), the copilot's `make_song` tool, the Octo cache, per-visitor and daily limits, the chat player and playback on a call.

**Done (part 1).**
- `music-agent/` (Dockerfile, `server.mjs`, `browser.mjs`, `flow.mjs`); compose service `music` (profile `music`, `init: true`, noVNC on `127.0.0.1:6080`); `deploy.sh` `deploy_music`; `docs/self-hosting.md` § 5 "The song maker".
- Chrome runs with `--no-sandbox` as the unprivileged `node` user: Docker's default seccomp refuses the namespaces its sandbox needs.

**Evidence.**
- Test container on the VPS: `/probe` opened Flow Music and listed its controls (`Describe your song...` box, `Send message`, `Chat settings`), signed out (`/__api/users/me` answers `null`); after each job no Chrome, Xvfb, x11vnc or websockify process was left; `/signin` served noVNC on the loopback port and `/signin/done` closed it.

**Next.** Owner signs in through the remote screen; then part 2.
