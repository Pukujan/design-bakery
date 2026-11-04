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

## Trace follow-ups (third commit)

From the owner's call on production (session `a5c2ed…`, 2026-11-03 06:32–06:40) and the owner's report that the page "doesn't scroll to the right place":

- **"Show me" on a call did not move the page.** `show_projects` only adds cards under the answer, and on a call there are no chips, so the page stayed put while it said "There they are". Now (`store.ts` `showCards`) the moon goes to the work list, scrolls the first card on screen before the answer is spoken, and points at the rest while it talks. Checked in the local site: the first card is fully in view 5 s in, then Cortex, Orbitgraph and Fluffy V4 are reached in turn. Section and citation scrolls on desktop were measured and land exactly.
- **The canned project list caught questions about one project or about the conversation.** Examples: "What stack is Precedent built with?", "what was the first project we talked about?", "what else does he have?", "the President project", "this project". These now go to the model (`answers.ts`), and five trace lines are added to `test:copilot-answers`.
- **Misheard names.** "President" was answered with a joke about executive orders. The call prompt now says the words come from speech recognition and to read a near-name as the project ("President" is Precedent, "Arise" is Arize).
- **Said it was opening a page without opening it** ("Let's start with Cortex", no navigate). The call prompt now forbids that and says to pick one on "any of them". In a local replay, "Just anyone, come on." navigated to /work/cortex.
- **Not a bug:** the `[email]` in the contact answer's trace is the trace mask (`tracing.ts`); visitors get the real address.

## Swipe lands in the right place (fourth commit)

Reproduced on `/research/papers/db-r-2026-010` with a three-cite summary (1280×768, heading target 169 px from the top):

- **Before:** the first heading reached its place and then scrolled away during its own sentence (the leg to the next heading started at once and ran 10 s). The second was in place only at 12 s, though its sentence starts at 4.5 s. The third was never reached, and the closing 240 px drift pushed the second off the top of the screen.
- **Why:** `passageSchedule` asks for 70 characters between moves, so a 67-character first sentence pushed the second cite two sentences late and left no room for the third. `swipeY` eased out of each heading straight away and drifted after the last. A heading not found had a target of 0 (the page top).
- **Now** (`citeRoute.ts`, `store.ts`): the page holds still while a passage is spoken and moves in one 1.1 s leg that ends as the next sentence starts; no drift; a swipe needs 40 characters between moves; a missing heading keeps the page where it is. Measured: each of the three headings sat at exactly 169 px from its sentence start until the next leg.
- **Faster voice-call scrolls** (`stageScroll.ts`): page, section and card scrolls take 1.2 to 2.4 s instead of 2.5 to 7 s.
- Checks: `test-copilot-cite-route.mjs` (new paper case), frontend `tsc`, eslint.

## The chat shows it replied (fifth commit)

The owner found that the hero chat looked as if nothing happened once it lost focus: the thread folds away and only "Ask a follow-up…" is left.

- **Hero peek** (`CopilotChat.tsx`, `chat-core.css`): folded, the hero shows one or two lines above the box, a pulsing dot with "Thinking…" while it works, then the start of the reply. Clicking it or the box opens the whole conversation. The thread no longer opens on its own while a reply is working.
- **A bubble when scrolled away** (`replyPeek.ts`, `CopilotDock.tsx`): with the hero off screen and the panel shut, a bubble over the pill shows dots, then the reply's first words for 12 s, and the pill says "New reply" until the chat is opened. A click opens the chat. If the moon is out, its own bubble carries the reply instead, so there is only ever one.
- Checked in the local site: hero peek while working and after the reply, a click opens the thread; scrolled away, dots then the reply, "New reply", and the pill back to "Continue chat" after opening. A saved reply (no working state) also shows. The moon carrying it was not seen live (the moon is out only on a call or while it guides).

## Continue chat on a phone (sixth commit)

The owner's iPhone screenshots: after Continue chat, the keyboard came up and the sheet sat far above it, with only the box on screen (part of it above the top edge) and the page showing between the box and the keyboard.

- **Sheet placed from the visual viewport's top** (`CopilotDock.tsx`, `copilot.css`): the sheet and the strip now hang from `visualViewport.offsetTop + height` (`--cp-vvtop`, `--cp-vvh`, `translate: 0 -100%`). The old `bottom: innerHeight - vv.height - vv.offsetTop` was wrong on iOS Safari, where innerHeight and the page offset change while the keyboard is up.
- **No keyboard on open on a phone**: the box is not focused when the sheet opens, so the visitor sees the conversation; they tap the box to type. Desktop and tablet still focus it.
- **One header row**: New chat moved into the bar next to Close, and the thread scrolls to the latest message once the panel has slid in.
- Checked at 375×812, 768×1024 and desktop. With a keyboard simulated (visible area 300 to 776 px), the sheet ended at exactly 776 px. Not yet checked on a real iPhone.

## Chip walks land, speak, and the call connects (seventh commit)

- **Chip walk on a phone** (`store.ts`): the owner saw the moon open a project without reaching its card first. It worked locally (home, a project page, the blog list, 375×812 and desktop), so the likely cause is a real phone moving the page under the glide (the keyboard closing after a chip tap). Now a chip on a phone blurs the box and waits for the keyboard to close; after the scroll the card is checked, scrolled to again, and put in place at once if it is still out of reach. Forced test: the card pushed 1,500 px lower mid-glide ended at 1,810 px, the second glide brought it to 245 px, and the moon pressed it.
- **Spoken walk lines** (`holdAudio.ts`, `store.ts`, `public/voice/walk-*.m4a`): on a chip walk in text chat the moon says a start line, a scroll line and a "found it" line (three of each, Pocket TTS `english-fast` on the Pro), with the same words in its bubble. One at a time and never cut off (a line still playing skips the next, except "found", which waits for it); a click, scroll or key fades it out; silent while a call is connecting or up. Checked: a project walk played start then found; a same-page section walk played start then found; with a call on, nothing played.
- **Voice not connecting** (`route.ts`, `store.ts`, `CopilotChat.tsx`): the voice service's first token after idle took 11.7 s (later ones 0.1 s), past the API's 10 s cut-off, which shows "Voice is unavailable". Now 25 s with one retry (the page waits 55 s), and a new `POST /api/copilot/voice/warm` (no pass, once a minute) reads the service's health page; the chat calls it 3 s after it mounts. The live API's logs were not read (gravebuster SSH timed out), so the cold start is the likely cause, not a confirmed one.
- Checks: `test-copilot-voice.mjs` (fixed a stale assertion on `call`; new retry, double failure and warm-up cases), `test-copilot-cite-route.mjs`, frontend and backend `tsc`.

## Production is the VPS; deploy kit renamed (eighth and ninth commits)

- **Docs** (6b792aa): every living doc, comment and example now says the site runs on the VPS (`ssh vps`, `~/apps/design-bakery`), deployed by Komodo's `design-bakery-deploy-on-push` → stack `design-bakery-vps`. The gravebuster autodeploy, systemd and launchd files are deleted. Historical task files and devlogs are left as written. (The seventh commit's note above that "gravebuster SSH timed out" was the wrong host.)
- **Rename** (a6876fb): `deploy/gravebuster/` → `deploy/vps/`. A stand-in `deploy/gravebuster/deploy.sh` covers the switch: the first deploy after the merge is started by the old script, which re-runs itself from the old path; the stand-in moves `.env`, `.env.api`, backups, `.deploy-state`, the lock and logs to `deploy/vps/` and execs the new script. Simulated end to end (bare origin, Komodo-style no-args run): files moved, secret kept, new script built from `deploy/vps/`, lock released.
- **Komodo paths**: pukujan-lab-2/server-management#122 points the stack at `deploy/vps/`. Merge it after this PR has merged and deployed once. That one deploy's Komodo `compose up` in the old folder fails (deploy.sh has already swapped the containers by then).
- **Next**: delete `deploy/gravebuster/` and its ignore lines once a deploy has run through `deploy/vps/`.

## "Voice is unavailable" on the live site (tenth commit)

- **Cause, confirmed on the VPS**: the voice service (`~/apps/copilot`, `demo/live-site/sablier.ts`) stops its agent container after 10 idle minutes, and `/api/voice/token` waits for it to start again before answering. The owner's call at 16:52 UTC on 2026-11-04 started the agent at 16:52:06, and it was ready at about 16:52:15. The live API (main 4d78839) gives the voice service 10 s, so a first call after an idle spell fails. The 25 s timeout and retry (seventh commit) fix this once PR #204 is deployed.
- **Warm-up fixed** (`route.ts`): `/api/copilot/voice/warm` read `/api/health`, which does not wake the agent. It now POSTs `/api/voice/options`, the service's own "widget loaded" wake (it starts the agent without waiting), so the agent is usually up before the visitor presses call. Test: two warm-ups make one wake call.
- Checked: the real service answers `POST /api/voice/options` with 200; with the agent awake, a token takes 0.19 s.

## The voice agent wakes on a visit; the call button is the moon (after #204)

- **Wake on visit** (`CopilotRoot.tsx`): the warm-up now runs as soon as any page loads (not only once the chat box mounts), again when the tab comes back to the front, and every 5 minutes while it is in front, so the agent (which sleeps after 10 idle minutes) is up before the visitor reaches the button. `warmVoice` still sends at most one every 4 minutes, and the API at most one a minute. Checked: one `/api/copilot/voice/warm` on load.
- **Moon call button** (`MoonCallButton.tsx`, `copilot.css`): the mic pill is now the mascot moon in a moon-cream pill with a breathing glow, a ripple now and then and two twinkling sparkles. It dozes (eyes shut, peeking awake every 7 s), wakes up and smiles on hover or focus, thinks with a quicker pulse while connecting ("Waking up…"), and turns into a red End call on a call. A lime mic badge keeps it readable as voice. Label "Talk to me". Reduced motion stops every animation. Checked at desktop and 375 px (fits, no sideways scroll); the connecting and on-call looks were not seen live.

## Rename finished; stand-in removed

- #204 deployed at 17:01:58 UTC through the stand-in (host files moved to `deploy/vps/`). After that, Komodo's own file check failed every 3 minutes until server-management #124 (17:55 UTC) pointed the stack at `deploy/vps/`. #206 then deployed from the new path at 17:58:05 UTC. server-management #122 was cut down to the CONVENTION.md row and merged.
- `deploy/gravebuster/` (the stand-in), its ignore and line-ending rules, and the doc note about it are removed. On the VPS that folder held only the stand-in.
- Live checks after #206: the wake-up fires on `/blogs` (204); the agent, asleep before the visit, was up within a minute and a token took 0.17 s; the moon button shows "Waking up…" on press. A full spoken call was not tried (the browser pane blocks the mic).
