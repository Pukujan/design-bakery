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

**Done (part 2).** The owner signed in on 2026-11-09.
- `music-agent/flow.mjs` `makeSong`: a new session, the prompt in "Describe your song", Send; a take counts when it was not seen before and finishes 20 s or more after the request (the page also loads older songs, already complete, and a take reports only once, when done). The first take's m4a is downloaded from Flow Music's public bucket. Session titles like "Today at 7:20 AM" are dropped.
- `backend/src/copilot/songs.ts`: cache (sha256 of style, subject, lyrics), limits (2 a visitor a day, 20 a day for the site, owner exempt), status and audio; `supabase/migrations/014_copilot_songs.sql` applied to Octo.
- `tools.ts` `make_song`: refuses unless the reply before asked what kind of song (`askedForStyle`). `route.ts`: `GET /songs/:id` and `/songs/:id/audio`; a song reaches a call too; the prompt adds games (riddles, a quiz, raps, limericks, two truths and a lie) and when to offer a song.
- Frontend `SongCard.tsx`: a player under the reply that waits, plays once by itself and has the lyrics; on a call a card over the page, and the microphone is held while it plays (`voice.holdMic`).
- VPS `.env.api`: `MUSIC_URL=http://design-bakery-music:8790` (backup `.env.api.bak-songs-20261109`).

**Evidence (part 2).**
- Song maker on the VPS: a moon jazz song made in 70 s (125 s long); Chrome, Xvfb and the screen closed after each job.
- Local site and API over an SSH tunnel to the song maker: "can you make me a song?" got a question about style and subject with three suggestions; "Lo-fi jazz about debugging late at night" started a song, the chat showed "Writing it now", and 75 s later it played by itself (2:01, no error, lyrics button).
- `test:copilot-tools` checks the ask-first rule, the cache key and that nothing starts without the song maker; the other copilot tests pass; frontend tsc and eslint clean.

**Not done.**
- Not tried on a real call yet (the card over the page and the microphone hold).
- One song at a time; a third waiting request is told to try again.

## Two takes, play once (2026-11-09)

- Flow Music makes two takes per song. The song maker now saves both (`<id>.m4a`, `<id>-2.m4a`) and reports `takes`; `/songs/:id/audio?take=2` serves the second. Octo `copilot_songs.takes` (migration 015, applied). The player shows Take 1 / Take 2 when there are two; switching keeps playing.
- A song autoplays once per song id for the page's life, not once per player mount: a remount (the chat reopening, a dev reload) had started it over.
