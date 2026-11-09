# TASK-DB-0158: The call stops dropping the caller's own voice

**Goal.** On a call the owner's own lines were greyed "Not your voice, so I let it pass." and "I was not sure that was for me." The voice match was too strict.

**Found** (design-bakery-voice logs, 2026-11-08, two calls). Dropped as another voice: "Tell the joke." 0.20, "Tell a joke." 0.25, "Show me something cool." 0.30, "Tell me" 0.32, all under the 0.32 cut-off. Dropped as unsure and short: "They are showing." (confidence 0.56) though its voice matched at 0.47. The 0.32 cut-off came from LibriSpeech and macOS `say` voices, where the caller scored 0.73 to 0.91; the print is learnt from one 1.5 s turn, and only turns at 0.5 or more refined it, so a thin first print never improved.

**Done** (`voice-agent/voiceprint.py`, `agent.py`).
- Cut-off 0.18 (`VOICE_MATCH_MIN`): only a clearly different voice is dropped; the copilot's addressee check (not_for_me) and the page's echo cancellation catch the rest.
- The caller's first three kept turns all join the print; after that, matches of 0.5 or more.
- A line dropped as another voice and said again within 30 s (similar words) is kept, and both voices join the print.
- A short unsure line whose voice matches the caller at 0.4 or more is kept (background scored at most 0.27 in the scripted calls).
- Tests: `tests/test_voiceprint.py`, new `tests/test_said_again.py`. README measurements updated.

**Next.** Check `voice.ignored` spans on the owner's next call; if a roommate or TV now gets answered, raise the cut-off a little rather than back to 0.32.
