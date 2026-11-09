# voice-agent — the site's voice call worker

The LiveKit Agents worker behind "Call AI Pujan". It hears and speaks; the copilot in the visitor's page decides what to say
(`copilot.greet` / `copilot.turn` over LiveKit RPC). It is a copy of the lab's worker (pukujan-lab-2/voice-agent-research,
`demo/live-site/speech/agent.py` at 67432b8), kept here so the site's calls can be tuned on their own (TASK-DB-0137). It registers
as `design-bakery-voice` and only joins rooms whose token asks for it (`backend/src/copilot/voiceToken.ts`).

## Not answering the room

The visitor's microphone hears their whole room. Three layers keep the copilot from answering it, each one testable on its own.
None of them asks the reply model to stay quiet.

| Layer | Where | What it catches |
|-------|-------|-----------------|
| **Hush** (Weya AI, Apache 2.0) | `hush.py`, in the worker | Takes background voices and noise out of the caller's audio before the voice detector, recogniser and voice match hear it. DeepFilterNet3 fine-tuned to treat a second voice as noise. |
| **Voice match** (3D-Speaker ERes2Net via sherpa-onnx, Apache 2.0) | `voiceprint.py`, in the worker | Learns the caller's voice from their first clear turn (≥1.5 s, recogniser confidence ≥0.85) and their next few, and drops turns in a clearly different voice: a roommate, a TV, the copilot's own voice heard back. A dropped line said again soon after is kept. Turns under 1 s are never judged. Also drops a short line (≤3 words) the recogniser was unsure of (<0.7). |
| **Addressee check** | `backend/src/copilot/addressee.ts` | The caller turning to someone else ("Hey Campos, can you grab me a coffee?"). Only a line that calls someone by a name not mine is asked about, with a small yes/no model call (3 s cap). On any doubt the line is answered. |

A dropped line is not lost. The page shows it greyed with the reason and an **Answer this** button. A tap answers it and tells
the worker (`agent.claim`) that it was the caller's voice, which widens the voice print. To LiveKit a dropped line is an empty
transcript, so a reply it talked over carries on (a false interruption). The orb's mute button ("Go silent") still works too.

Settings (env): `HUSH_LIB`, `HUSH_MODEL` (Hush is off without both, or with `HUSH=off`), `HUSH_ATTEN_DB` (default 100, no limit),
`VOICE_MATCH_MODEL` (the voice match is off without it), `VOICE_MATCH_MIN` (cut-off, default 0.18).

## Measurements (2026-11-03)

**Voice match cut-off.** 14 LibriSpeech speakers (clean test set): at 1.0 s of speech and a 0.32 cut-off it keeps 98% of the
caller's turns and drops 98% of others'; from 1.5 s, 100% both ways. The copilot's own voice against a caller scores 0.07–0.25.
wespeaker CAM++ was close to random under sherpa-onnx (same speaker median 0.65, others 0.47), so it was not used.

**Hush cost.** 1.5 ms per 50 ms frame in the docker image (3% of one core); it is causal, so it adds no wait.

**Scripted call** (`scenarios.py`, 12 lines: caller alone, a roommate at two volumes, a TV with noise, the copilot's echo, the
caller turning to "Campos", the caller talking over the roommate):

| Run | Wrongly ignored | Wrongly answered | Notes |
|-----|-----------------|------------------|-------|
| Old worker, `[quiet]` reply rule | 0 | 2 | Answered its own echo and "Are you on a call right now?". Recogniser confidence was 0.97–1.0 on background lines, so a confidence gate alone catches none. The overlap transcript included the roommate's "Do you need anything?". |
| Voice match + addressee check (Mac, no Hush) | 0 | 0 | Background scored 0.15–0.26, the caller 0.73–0.91. The overlap turn scored 0.52 and still carried the roommate's words. |
| Hush + voice match + addressee check (docker) | 0 | 0 | Background 0.04–0.27, the caller 0.78–0.89. The overlap transcript was the caller's line alone. Replies started about 2 s after the caller stopped. |

One earlier docker run lost 4 lines because the reply models were busy (503s, then slow providers) and two `copilot.turn` RPCs
passed their 45 s limit; nothing in the worker dropped them.

Caveat: the people in the scripted call are macOS `say` voices, which a speaker model separates more easily than two real people.
Check the live traces (`voice.ignored` spans, `voiceMatch` on `copilot.turn`) after release before trusting the cut-off.

**Live calls, 2026-11-08 (DB-0158).** The owner's own lines scored 0.20–0.32 against a print learnt from one turn and were dropped as
"another voice" ("Tell the joke.", "Tell a joke.", "Show me something cool.", "Tell me"); "They are showing." matched at 0.47 but was
dropped as unsure and short. Now: the cut-off is 0.18; the caller's first three kept turns all join the print; a dropped line said
again within 30 s is kept and both join the print; and a short unsure line in a voice matching the caller at 0.4 or more is kept.

## Run it

Local stack: a LiveKit dev server (`livekit-server --dev`, or the `livekit-dev` container), the speech server on `SPEECH_URL`
(tunnelled from the Pro: `ssh -N -L 8799:127.0.0.1:8799 mac-pro`), and the API with `VOICE_LIVEKIT_*` set. `.claude/launch.json`
has all of them.

```bash
python3.12 -m venv voice-agent/.venv && voice-agent/.venv/bin/pip install -r voice-agent/requirements.txt
```

On a Mac the worker runs without Hush (no Linux library):

```bash
VOICE_MATCH_MODEL=voice-agent/models/voice-match.onnx voice-agent/.venv/bin/python voice-agent/agent.py dev
```

With Hush, build the image (the Dockerfile builds `libweya_nc` from Hush's source at a pinned commit and fetches both models by
checksum) and run it next to the local LiveKit:

```bash
docker build -t design-bakery-voice:dev voice-agent
```

```bash
docker run --rm --network container:livekit-dev -e LIVEKIT_URL=ws://127.0.0.1:7880 -e LIVEKIT_API_KEY=devkey -e LIVEKIT_API_SECRET=secret -e SPEECH_URL=http://host.docker.internal:8799 -e OCTO_TRACES=off design-bakery-voice:dev
```

The log says `hush on | voice match on` when a call starts.

## On the VPS

The worker is the `voice` service in `deploy/vps/docker-compose.yml` (profile `voice`), deployed by `deploy/vps/deploy.sh` with
the rest of the site once `deploy/vps/.env.voice` exists. It uses the copilot stack's LiveKit (`ws://copilot-livekit:7880` on the
`copilot_default` network) and speech through the shared speech gateway (`http://host.docker.internal:18800`, Komodo stack
`speech-gateway`; pukujan-lab-2/voice-agent-research `docs/speech-gateway.md`). Every speech request carries
`X-Speech-Project: design-bakery` (`SPEECH_PROJECT`) and `X-Speech-Call: <room>`, so a call stays on one speech server, and the
call's place is released (`POST /release`) when it ends. A 503 `no_room` (every server full) is an ordinary speech error: there is
no cloud fallback. Calls reach
it only when the API mints the tokens (`VOICE_LIVEKIT_*` in `.env.api`). How to switch over and back: `docs/self-hosting.md` §5.

## Test it

```bash
voice-agent/.venv/bin/python -m unittest discover -s voice-agent/tests
```

```bash
cd voice-agent && .venv/bin/python scenarios.py --json out.json
```

`scenarios.py` joins a call the way the page does and plays the room into the microphone. It prints each line with what was
expected and what happened, and a total of lines wrongly ignored and wrongly answered. `--caller <say voice>` changes the caller and
`--only 1,4` runs some lines. The addressee check has its own test: `pnpm run test:copilot-addressee`.
