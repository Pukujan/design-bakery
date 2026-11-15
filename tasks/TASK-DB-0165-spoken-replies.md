# TASK-DB-0165: the copilot reads its replies aloud outside a call

Issue: [#262](https://github.com/Pukujan/design-bakery/issues/262) (leaf; parent: none; dependencies: none).

**Goal.** Owner, 2026-11-14: "whenever it replied or took me anywhere it also did by voice, either cached if it's cached summaries, which I'm expecting most responses to be, or a new one if it's vague new questions that need answering."

**Found.**
- Typed replies were only spoken on a call (`typedReply.hook` in `voice.ts`, and only for the saved greetings). The moon's walk lines (`walk-*.m4a`) were already said aloud on page moves.
- No reply was cached: every chat line, the page buttons' "Summarise this for me." included, went to the model, so a cache keyed on the words alone would almost never hit.
- The speech gateway (`:18800` on the VPS) answers `POST /tts` with raw 16-bit PCM at 24 kHz; cold, a first clip took 21.6 s (models loading on the Pro), warm 0.07 s to 3.8 s for a 7 s clip. The API image has no ffmpeg, so clips are WAV.

**Done.**
- `backend/src/copilot/speech.ts`: a finished reply is registered (markdown, links and emoji taken out; a reply mostly in another script is left unspoken) and synthesised at once through the gateway (`X-Speech-Project: design-bakery`, no call id, 30 s limit), kept in memory and as a public Octo file with a row in `public.copilot_speech` keyed by a hash of its words. `GET /api/copilot/speech/:id` serves only ids `/chat` handed out or clips already kept, cached for a year.
- Page-button summaries (`Summarise this for me.` on a page, not on a call) are kept in `public.copilot_summaries` for 7 days and replayed with their chips, so a summary is the same words and the same saved clip for everyone: instant. Not kept when the turn was cut off, booked, made a song or moved the page.
- `route.ts`: `speak` in the chat body; speech warmed as the turn starts; `done` carries `speech: { id, ready }`.
- `holdAudio.ts`: `primeReplyVoice` (inside the click or Enter; unlocks one shared element), `speakReply` (after the walk line ends), `stopReply` on any click or key once it is playing, and on a call. `setReplyVoiceOff` remembered in `localStorage` (`db-copilot-voice-off`), also silencing the walk lines.
- `CopilotDock.tsx`: a speaker button in the chat's top bar; lit while a reply is read, dimmed when off.
- Migration `018_copilot_speech.sql`, applied to the Octo workspace on 2026-11-14 (both tables listed afterwards).
- `scripts/test-copilot-speech.mjs` (in CI): spoken text, WAV header, one synthesis for two requests, the project header, no "say anything".

**Evidence (before merge).** `pnpm test:copilot-speech` passes against a fake gateway; backend and frontend `tsc` and eslint clean.

**Next.** Merge, check the Komodo deploy, then on the live site: a typed question and a page button with sound.
