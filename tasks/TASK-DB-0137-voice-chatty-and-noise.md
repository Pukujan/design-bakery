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

## A vague "show me anything" starts a tour (twelfth commit)

Traces on 2026-11-04: "just show me anything" four times got headings read out and a question back, and "anything." after the greeting got "What are you working on these days?". Three causes: no routine for a vague ask (the model decided), the text prompt said "even if they ask to see a page directly, ask first", and replies ended in offers.

- `routines.ts`: `asksForSurprise` + `surprise` open the next stop with no model call and no question (shipped projects, the newest approved paper, the newest post, the rest, then the booking line). What was visited is read from what the assistant already said, so nothing is stored. A bare "anything" counts only after a question; a topic ("anything about RAG") or a real question does not.
- `route.ts`: `tour:` answers are kept even when the previous line ended in "?"; the "ask first" rule now treats an explicit or vague show-me as the yes.
- `health.ts`: the free reasoning model stays last on calls (its probe is quick, its real replies took up to 16 s).
- Tests: `test-copilot-router.mjs` (trace phrases, repeats move on, no "?", non-triggers) and `test-copilot-truncation.mjs`.
- Not verified against a live call; check Phoenix for `copilot.routine = tour:next` after deploy.

## A dropped call redials once (thirteenth commit)

"The call disconnected" kept appearing. The voice service (`~/apps/copilot`) shipped four releases in 50 minutes on 2026-11-04 (#135 to #138; #136 recreated LiveKit at 23:10, the agent was replaced at 23:25 and 23:34), and a deploy ends every call in progress. The path itself checked out afterwards (pass, grant, `/rtc/validate` 200 from the owner's network).

- `voice.ts`: `dropped()` replaces `close(message)` on an unexpected disconnect. A call that had reached an agent is redialled once, at once and silently (the moon shows "Waking up…"); a second drop, or a call that never connected, ends with the message as before. Hanging up or pressing the button resets it.
- `pnpm test:voice-redial` bundles the real `voice.ts` with esbuild against a fake LiveKit room: a drop redials once with a fresh grant and no message, a second drop ends it, hang-up resets, no agent means no redial, an agent leaving redials. It fails on the old code ("a second room is dialled").
- Not verified on a live call (the browser pane blocks the microphone). The deploy cadence of the voice service is a separate matter, in its own repo.

## Voice models ranked by real reply time (fourteenth commit)

A live call on 2026-11-05 took 5 to 10 s per reply (one 32 s). `workbuddy` answered 8 of 14 turns though it was the slowest on real prompts (median about 5.5 s against about 2.5 s for deepseek and qwen): the call ranked providers by a two-line health probe.

- `fallbackFetch` now tells `onUse` how long the answering model took to start (response plus first chunk); `route.ts` feeds that to `noteLatency` (`health.ts`), a moving average per provider.
- On a call, `byHealth` ranks by the measured time once a provider has two samples, else by the probe. The free reasoning model still stays last, failing providers after.
- Test: group 8 in `test-copilot-truncation.mjs` (one sample does not reorder; two do; chat keeps table order; junk samples ignored).
- Not verified on a live call. Look at `copilot.model` and `copilot.latency_ms` in Phoenix after deploy.

## A follow-up about the page on screen goes to the model, not the canned list (fifteenth commit)

On the call of 2026-11-05 (01:24 to 01:27 UTC) three asks about a paper got the saved research list, "11 working papers. The newest is...": "You wanna show me this paper and talk me through it?", "Do you wanna show me this paper and summarize it for me?", "What does this paper try to say?". The paper was never read. The saved intents fire from a keyword ("paper", "research") even mid-conversation.

- `answers.ts` (`cachedAnswer`): after the first turn, a sentence that points back ("this", "that", "it", "them"...) or asks for a summary or explanation ("summarize", "explain", "talk me through", "what does ... say") is the model's, with its tools. Thanks and small talk are exempt.
- `test-copilot-answers.mjs`: the real phrases must reach the model; "thanks, got it" and the plain research list question still work.
- Also seen on that call: a text-to-speech socket timeout at 01:26:14 (retried now, voice-agent-research #146) and an 18.5 s turn on workbuddy before the speed ranking (#213) deployed.

## Booking by voice is a checked dialogue with a visible button; a call simulator guards it (sixteenth commit)

The call of 2026-11-05 (02:42 to 02:48 UTC): "Fo John" became the name John unchecked; "Poojan three six four five at gmail dot com" was never read back; the model said "the booking card is up" three times without calling the tool (once calling it with nothing in it) and once on a page that could not show it. Root causes found while reproducing it locally:

- A voice call drops every `book` action twice over: the server (`route.ts`, "On a call there are no buttons") and the store (`store.ts`, "On a call there are no chips"). So the model's `book_call` could never put anything on the screen, whatever it said.
- Nothing checked a name or email with the caller, and nothing stopped the reply claiming success without the tool.

- `booking.ts`: the voice booking is a fixed dialogue (ask the name, spell it back, ask the email, spell it back, ask the area, then exactly one `book` action). A no asks for the letters. State is rebuilt from the conversation each turn. `routeRequest` runs it first on a call; `booking:` answers are kept even after a question.
- `route.ts`: the `book` action now reaches a call (cached and model paths).
- `store.ts` + `BookingCard.tsx` + `copilot.css`: a call shows the booking as a card above the call bar with the name, email and one "Pick a time" button.
- `scripts/sim/call-sim.mjs` + `scripts/sim/scenarios/*.json`: a call simulator. It plays a conversation through the real backend in voice mode (`api-voice` launch config, localhost exempt from the rate limit), keeps the page the way a call does, and checks each turn's actions, order, count and claims. Exit 1 on any failure; `--runs N` repeats it. The same flow was driven end to end in the browser (`window.__copilot.send(..., { voice: true })`): the card appeared on /contact with the right name and email.
- `test-copilot-booking.mjs`: parsers and the dialogue, including the "Fo John" and wrong-email corrections.

## Next and previous follow what is on the screen; a list page is scrolled through (seventeenth commit)

The same call: a "Next." asked on a paper went to a project (the tour's first stop), "Next one." on the blog list went to a project too, and after "show me the research papers" the page stayed at the top while the answer named eleven papers.

- `routines.ts`: `stepRequest` + `neighbour`: with the page the call is on (`route.ts` now passes it), "next", "previous" and their variants open the neighbouring paper or post, with a short summary and what comes after it; the end of the list says so and names where to go. Elsewhere "next" is the tour as before.
- `store.ts` + `voice.ts`: an agent move to a list page (research, blogs, work) is marked; the answer is then spoken while the page glides down through the list (`scrollThroughList`, paced by the speech, at most 3.5 screens, handed back at once to the visitor's wheel, touch or key).
- `store.ts` `go()`: from one paper to a sibling the call goes straight there instead of out to the list and back through a card.
- `scripts/sim/browser-call.mjs`: the same flow in a real Chromium (Playwright) against the local web app and backend: list scroll depth, next/previous, the booking card in view. `pnpm sim:call <scenario>` and `pnpm sim:browser`. Scenario `papers-next.json` walks all eleven papers and back.
- Not done: blog "next" cannot be played locally (the blog database is not readable here); "next" on a project follows the tour order, not the home page's display order (`orderProjectsForShowcase` is in the frontend).

## One-word lines were dropped as "said to someone else"; a summary is said from the page; fewer wasted steps (eighteenth commit)

Found with the real-browser check, which sends lines the way the voice agent does (without `toMe`, so the addressee check runs): the first "Next." from the papers list was answered `{"type":"ignored","reason":"said to Next"}`. `addressee.ts` reads a capitalised first word followed by a full stop as a call to someone, and the recogniser capitalises every line, so "Next.", "Previous.", "Research.", "Marketing." and a name given as an answer read as a person named Next, Research, Poojan; the small model said it was not for the assistant, and the line was dropped without a reply. Phoenix has it in the call of 2026-11-05: "Research." at 01:24:39 got `copilot.model = addressee` and an empty answer. The simulator had hidden it by always passing `toMe`.

- `addressee.ts`: a line of one or two words that is not a greeting plus a name is never a call to someone else; the non-name list gains the words said to a page (next, previous, research, project, blog, contact, book, marketing...). "Hey Campos!" and "Campos, the oven is on." still are. Regression lines in `test-copilot-addressee.mjs`.
- `routines.ts` `pageSummary`: "summarise this", "what does this paper try to say", "explain this" on a paper, post or project is answered from the page: its abstract or tagline, two quoted passages that carry the argument (not future work, tag lists or status notes), whether it is a pending draft, and `cite` swipes so the page follows the words. Instant (a few ms) and grounded. Before, the model said only "Here it is." in 3 runs of 4 on the simulator whatever the prompt said.
- `route.ts`, `tools.ts`: a call has no follow-up buttons, so `suggest_followups` is not offered (each tool is a model round trip); `book_call` on a call tells the model to send the caller to the booking dialogue and never to say a card is up; a call is capped at four steps; project cards (`projects`) and page-following `cite` now reach a call; the prompt says to say a summary, not "Here it is".
- `/pass` skips its rate limit for the owner's exempt addresses (the simulator asks for one per run).
- Tried and removed: making `outline_passages` and `cite_section` read a page themselves. It saves a model round trip but removes the guarantee that the model has seen what it cites (`test-copilot-cite` rightly refused it).
- `scripts/sim/call-sim.mjs`: no longer passes `toMe`; counts tool steps (`maxSteps`, `noTools`, `maxTool`); checks reply length (`minChars`); fails any line dropped as said to someone else. New scenario `tools.json`.

## The booking dialogue asks how to say a name (nineteenth commit)

The owner: "make it smart with pronunciation and names and spellings, like asking maybe?". After the caller confirms the spelling of their name the dialogue asks "How do you say your name? Say it slowly, a syllable at a time." (`booking.ts`, `parseSay`): "poo jun" becomes "Poo-jun" and is used for the rest of the call ("Thanks, Poo-jun.", the closing line); "fine as spelled" keeps the name; filler or a story is asked once more, then the name is used as written. The booking itself (the card, the URL) keeps the written name. State is still rebuilt from the conversation. Tests: `test-copilot-booking.mjs` (parser, spoken form, unclear answer), both simulator scenarios and the real-browser check gained the step.
