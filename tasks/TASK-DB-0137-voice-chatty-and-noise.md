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

- **[quiet] on a call** (`route.ts` VOICE_NOTE, `textFilter.ts`): words clearly not said to it (a side conversation, a name not its own, an echoed line) get `[quiet]`. The filter swallows it, the route sends a `quiet` event, the page drops the turn from the chat, and the agent says nothing. When in doubt it answers.
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
- The voice worker (`chatbots` repo, `demo/live-site/speech/agent.py`) is unchanged. VAD minimum speech is 0.15 s, there is no STT-confidence gate, and the page's RPC reply carries no `call` id, so the worker's `voice.turn` spans (in the chatbots workspace) don't join the page's session.
