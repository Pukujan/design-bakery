# TASK-DB-0114 — voice call: saved lines, reminders, space language

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0114-voice-connect-lines` (from `main`) |
| **Status** | In review |

## Goal

A voice call could sit silent for seconds while the agent joined, and a quiet call never said anything. The owner wanted saved responses while it connects, reminders when nobody speaks, a more interesting orb, and the voice always speaking as AI Pujan in the first person.

## Done

- Connecting: saved clips in the agent's own voice (Pocket TTS, rendered on the MacBook Pro) play from the click: "Hold on, I'm getting set up...", "I'm warming up...", "Almost there...", then one "taking longer than usual" line at about 12 s. They fade out when the agent joins. The line being spoken shows in the orb.
- Quiet reminders: a connected call that goes quiet gets a saved line every 10 to 20 seconds (four lines, random order), up to four times, starting over whenever anyone speaks. A muted visitor is told their mic is muted instead. Capped on purpose, so it never nags forever.
- Smoother connect: the voice grant is requested in parallel with the microphone prompt.
- The button reads "AI Pujan". The orb says where the call comes from, picked at random each call and never the same twice in a session: "Listening from Betelgeuse", "Hearing you from Sirius", "I'm just Pujan from Titan", and so on. The old subtitle lines are gone.
- Mute and End are space-themed: "Go silent" / "Open channel" / "End transmission", with a lit ring and glow.
- The spoken greeting is first person: "Hi, I'm AI Pujan..."

## Checks

- tsc and eslint pass. Local dev server: the orb shows "Hearing you from Betelgeuse" with the themed buttons; the clips fetch (200, audio/mp4); the connecting sequence and the reminders fire at the expected times (a reminder at 16 s in a 24 s run).

## Not done

- A real call has not been made: the voice service is not reachable from local dev.
- The agent's own side (it loads its speech models on a cold start) is in the chatbots repo and is unchanged.
