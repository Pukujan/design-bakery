# TASK-DB-0162: the call hears the caller from the first word

**Goal.** A call that "didn't understand me at all" (owner, 2026-11-10) should not happen because the speech models were cold.

**Found.**
- The owner's call (2026-11-09 23:25 UTC, 50 s): the worker got the audio but logged no dropped turns, and no turn reached the copilot. It was the first call in hours, and the Pro loaded the speech models at call start.
- `voice-agent/scenarios.py` against the live site:
  - cold: the caller's first line was transcribed exactly, but reached the copilot 16 s after it was spoken;
  - warm, minutes later: every caller line was heard word for word and answered in about 5 s, and the TV was ignored.
- `/api/copilot/voice/warm`, which the page calls, only woke the old hosted voice service. Since calls moved to our own worker it did nothing, so nothing loaded the models before a call.

**Done.**
- The API asks the shared speech gateway to load this project's models (`POST /warm?project=design-bakery`; it answers at once) when a visitor hovers, focuses or touches the call button (`/voice/warm?call=1`) and when a call starts. At most once a minute; never on a plain page view, so readers don't take the Pro from Riley's or Maybe Home's models.
- The `api` service gets `SPEECH_GATEWAY_URL` and the `host.docker.internal` alias. No gateway routing change.

**Next.** Check a cold call after the deploy: wait until another project's models are on the Pro, then hover the call button, call, and see that the first line is answered in a few seconds.
