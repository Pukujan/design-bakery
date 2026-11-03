# TASK-DB-0126 — a voice call that behaves like an agent

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0126-voice-agent-behaviour` (from `main`) |
| **Status** | In review |

## What the owner saw (and the traces showed)

Trace session `956eced0…` (2026-11-03, a real call, 27 turns): every "show me" needed a spoken "yes" first ("Fair point. Want me to open the Project Continuity page?" then "Yeah." then "Opened."); model turns took 6 to 13 s with silence in between; two turns returned an empty answer after the model only called tools; "Show me your project." was answered as Project Continuity Modules because the slug starts with "project"; the side panel opened on every move; the 10 to 20 s reminders fired while it was still thinking.

Cached answers are logged: each is a `copilot.turn` span (1 to 174 ms). They were not labelled, so the model path could only be told apart by duration.

## Done

- **No side panel, no buttons on a call.** A voice reply never opens the panel and carries no chips. The backend takes a `voice` flag from the call.
- **It moves the page itself.** On a call, instant answers about the tour, projects, a project, the blog, research, experience, who I am, contact and booking follow their page or section on their own. The model's `navigate` tool works without a spoken "yes" on a call, and the voice prompt says to say where it is going and call it. Greetings and small talk never move the page.
- **Passage by passage tour.** The voice tour is three spoken passages (about, work, experience) with a scroll to each as the words reach it (`steps` in the answer, timed at 14 characters a second).
- **Slow, long scrolls on a call** (2.5 to 7 s by distance, eased in and out) through Lenis; the cursor shows a wheel and arrows moving up or down while it scrolls.
- **Fillers while it thinks.** After 0.7 s without an answer: an opener, up to two continuations, one "taking a while" line, then silence. Clips are recorded as flowing multi-beat utterances ("Hmmm... let me see...") with silence trimmed and a 120 ms join, in the agent's voice. When the answer lands, the clip in progress finishes, a closer plays ("...ahh, here it is."), and only then does the answer go to the agent, so nothing is cut off. An instant answer never gets a filler. The visitor speaking stops a filler.
- **Reminders** hold off while an answer is being worked out or spoken (every speaker event also resets them).
- **The moon.** While a call is on, a small moon mascot lives on the page: wanders, sits on the Continue chat button and dozes there, runs from the visitor's pointer, tumbles when the page scrolls or is swiped, and spins now and then. When the agent acts it rolls to the link (found in the live page, so it fits phone and desktop layouts), presses it, and only then does the page change; after a scroll it taps the heading it came to show.
- **Trace labels.** Every `copilot.turn` span now carries `copilot.model`, `copilot.source` (cache or model), `copilot.channel` (text or voice) and `copilot.actions`.
- **Empty model replies** get a fallback line ("Here it is." after a move, else "I lost my train of thought there...").
- **Alias bug:** a project's generic first word no longer matches ("show me your project").

## Checks

- tsc, eslint, `find-orphans --strict`, `test:copilot-answers` (adds the voice tour and the alias bug), and the content test pass. Measured locally: the filler chain (opener, continuation, continuation, closer) with the clip in progress finishing before the closer; an instant answer produces none; a slow scroll to a section took about 3 s with an ease in and out and landed exactly on the section; the moon glided to the Contact link, the path changed, then it pointed at the new page.

## Not done

- No real call was made: the voice service is not reachable from local dev, so the call path (the filler timing against real model latency, the agent speaking after the RPC) is checked in parts, not end to end.
- The clips were rendered but never heard by me; the owner is reviewing six sample recordings.
- Voice calls can echo a filler back through the speakers into the mic; echo cancellation is on, headphones avoid it.
- The TASK-DB-0124 service answers (Contact page buttons) will want the same Contact move on a call once both are merged.
