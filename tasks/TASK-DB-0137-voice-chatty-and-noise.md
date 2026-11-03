# TASK-DB-0137 — a voice call that is good company and ignores the room

| Field | Value |
|-------|-------|
| **Created** | 2026-11-03 |
| **Branch** | `task/TASK-DB-0137-voice-chatty-and-noise` (from `main`) |
| **Status** | In review |

## What the owner found (and the traces showed)

The owner found the call boring: it mostly talks about the work, does little small talk, and never ends a turn on a joke. It also answers other people in the room, and its fillers get cut short and keep changing.

Phoenix, 48 voice turns on 2026-11-03 (session `956eced0…`):

1. **Its own voice heard back.** "Who is There it is." was the visitor plus the closer "Ahhh... here it is.", which plays from the page outside the call's echo cancellation.
2. **The room answered.** "Hey, Campos!", "Cat", "But it's coming.", and three replies in 5 s to a side conversation about Chad the rat.
3. **A brochure, not a person.** Nearly every reply ended "Want me to open the Work page?", even while the visitor fed Chad. The canned "how are you" said "I mostly think about my own work". It corrected the visitor twice with "I'm Pujan, not him", and refused a light roast it was asked for.
4. **Fillers cut mid-word.** Fillers start at 1.5 s and run 5 to 6.5 s, while most answers land at 2 to 5 s, so they were faded mid-word. The chain then switched clips every 0.7 s.

## Done

- ~~**[quiet] on a call**~~ (first commit) was replaced by the layers below: asking the reply model to stay quiet missed the loud roommate and the echo, and is not testable on its own.
- **Echo stripped** (`holdAudio.ts` `withoutEcho`, `voice.ts`): for 6 s after any clip plays (filler, closer, nudge, recorded greeting), a run of two or more of its words at the start or end of the question is removed, along with lone "hmm"/"okay". If nothing is left, there is no turn.
- **Fillers stop on a pause**: each clip's pauses are measured from the file. When the answer lands, the filler runs to its next pause if that is within 1.8 s, else fades. There is now one opener plus one follow-on with a 1.2 s breath, and never the same opener twice running. An empty answer stops the filler with no closer.
- **Personality on a call**: stay on the visitor's topic, take your own side, and end about a third of replies on a dry or sarcastic line instead of a question. Offers to open a page are rare and never two turns running. Good-natured teasing of tech figures is fine. Never correct "he" or a wrong name (also in `SYSTEM`).
- **"How are you"** canned replies are rewritten to be playful and turn the question back (backend and the offline copy).

## Checks

- Frontend and backend `tsc`, eslint on touched files, `test:copilot-stream` (new case 7: quiet), and `test:copilot-answers` all pass.
- Echo: with the closer just played, "Who is There it is." becomes "Who is" and "There it is." becomes nothing. "Tell me about Chad" and "Is it good?" are unchanged.
- Live replay of trace lines against the local API on the real model chain (voice on):
  - "Hey, Campos!" and "Mom, can you turn that down?" were quiet every time.
  - Real questions were always answered.
  - The visitor's own rambling Chad line was quiet in 1 of 3 runs, so that judgment can still go wrong.
  - Small talk stayed on Chad and McDonald's with jokes and no page offers.
- Not checked: a live call.

## Not done

- Direct questions about the work still often end "Want me to open…?", and a "Sure." to such an offer sometimes gets the offer again instead of a move.
- The worker's deploy: a compose service on the copilot network, `deploy.sh`, the `.env.voice` and `VOICE_LIVEKIT_*` secrets.
- The voice match cut-off was set on LibriSpeech and `say` voices; check it against live `voice.ignored` spans after release.

## Not answering the room (second commit)

The worker is now in this repo (`voice-agent/`, copied from the lab at 67432b8; it registers as `design-bakery-voice`). Details and
numbers: [voice-agent/README.md](../voice-agent/README.md).

- **Hush** (`voice-agent/hush.py`): DeepFilterNet3 fine-tuned to remove background voices runs on the caller's audio before
  anything hears it. The Dockerfile builds `libweya_nc` from source (pinned commit) and fetches the model by checksum.
- **Voice match** (`voice-agent/voiceprint.py`): learns the caller's voice from the first clear turn and drops turns in another
  voice (roommate, TV, its own echo). Score in `copilot.turn` (`voiceMatch`) and in `voice.ignored` spans.
- **Addressee check** (`backend/src/copilot/addressee.ts`): only lines that call someone by another name are asked about, with
  a 3 s yes/no call that skips busy providers; on doubt the line is answered. The `[quiet]` rule is gone from the prompt and filter.
- **Fallback**: dropped lines show greyed in the chat with the reason and **Answer this** (`CopilotChat.tsx` `IgnoredLine`); the tap
  answers aloud and tells the worker the voice was the caller's (`agent.claim`). The existing mute stays.
- **Scenario harness** (`voice-agent/scenarios.py`): a 12-line scripted call, scored.

Evidence (local stack, 2026-11-03):

| Run | Wrongly ignored | Wrongly answered |
|-----|-----------------|------------------|
| Old worker with `[quiet]` | 0 | 2 (its echo; "Are you on a call right now?") |
| Voice match + addressee check, no Hush | 0 | 0 (overlap transcript still had the roommate's words) |
| Hush + voice match + addressee check (docker) | 0 | 0 (overlap transcript clean; replies about 2 s after the caller stops) |

Hush costs 1.5 ms per 50 ms frame (3% of a core). An earlier docker run lost 4 lines to busy reply models (two 45 s RPC
timeouts), not to the worker. Checks: worker unittest (14), `test:copilot-addressee`, `test:copilot-stream`,
`test:copilot-answers`, backend build, frontend tsc and eslint.
