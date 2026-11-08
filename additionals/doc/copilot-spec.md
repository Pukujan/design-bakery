# AI Pujan copilot: behaviour spec

| Field | Value |
|-------|-------|
| **Document date** | 2026-11-05 |
| **Created** | 2026-11-05 |
| **Last updated** | 2026-11-06 |
| **Task** | [TASK-DB-0137](../../tasks/TASK-DB-0137-voice-chatty-and-noise.md) |

This is the contract for how the site copilot (AI Pujan, by voice and in the chat) behaves on every turn. It is written for one human visitor who can ask anything at any time: a question, a tour, a fast summary of everything, a booking, "next", a change of mind, an interruption, in any order and mixed together. There are no visitor types and no modes.

Tests cite the ids below (`INV-*`, `EX-*`, `MR-*`, `T-*`, `O-*`, `J-*`). A change in behaviour changes this file in the same PR. Every status line says what holds today and what is planned; "planned" means not built.

## 1. Scope

- Covered: one `POST /api/copilot/chat` turn on either channel (`voice` or chat), the state the page keeps between turns, what the page is sent back, and how all of that is tested.
- Not covered: rate limits, the visitor pass and Turnstile, the voice agent's audio path (`voice-agent/`: Hush, the voice match, turn detection), and the site content itself.

## 2. Principles

| Id | Principle |
|----|-----------|
| P-1 | One person, any request at any time. Nothing decides in advance what the visitor is or wants. |
| P-2 | The model reads every line. No code matches wording (no regex, no keyword lists) to decide what a line means. |
| P-3 | The model chooses; code holds state and checks every action. A rule that must never break is enforced by a tool or by what is offered, not by the prompt. |
| P-4 | State lives in the page and is sent with each turn. The server keeps nothing between turns. |
| P-5 | Fast and cheap by construction: stored text where it can be, one model call where it can be, a small fixed prompt. |
| P-6 | Every rule holds in every lane (`strong`, `hybrid`, `small`), within that lane's limits, so lanes can be switched. |

## 3. One turn

1. **In:** the newest line, up to 24 earlier messages, the page (`path`, `title`), `voice`, the open threads (§4), `toMe` (the visitor tapped "Answer this"), and the rolling notes on older chat.
2. **Lane:** `laneNameFor(channel)` picks the lane; only that lane is loaded (`lanes/loader.ts`).
3. **Offer:** the tools are filtered by channel, then by the open threads, then by the lane's list (§5, O-1 to O-4).
4. **Context:** the page and one short note per open thread ride on the user's line, not the system prompt, so the prompt stays identical across a conversation.
5. **Decide:** the model answers, calls tools, or both, within the lane's step and token limits.
6. **Act:** each tool checks its input against the content and the thread state, then emits actions and thread updates. A tool that refuses returns an error the model reads; it never emits.
7. **Out:** an NDJSON stream of events: `text`, `action` (`navigate`, `cite`, `projects`, `book`, `link`, `ask`), `step`, `flow` (thread state, only when it changed), `ignored`, `done`, `error`.
8. **Keep:** the page stores the thread state from the `flow` event and sends it back on the next turn (`store.ts` `callFlow`). Hanging up clears it (`voice.ts` `close`).

## 4. Threads

A thread is something the person started that spans turns. Any number can be open at once. None of them is a mode: an open thread never stops any other request from being served.

| Thread | Held as | Opened by | Moved by | Closed by | Status |
|--------|---------|-----------|----------|-----------|--------|
| Page | `page { path, title }` | always open | `navigate`, `step_list`, a tour stop, `booking_start` | never | today |
| List position | the page itself (a paper, post or project page sits in its list) | landing on a list item | `step_list` | leaving the list | today |
| Booking (voice) | `flow { kind: 'booking', data }` (`bookingState.ts`) | `booking_start` | the current step's tool | its last step, `booking_cancel`, hanging up | today |
| Tour | `{ route, stop, paused }` | `tour_start` | `tour_next`, `tour_back`, `tour_skip` | `tour_end`, the last stop, a new `tour_start` | planned; today `tour_next` guesses the next stop from what was already said (`nextTourStop(said)`) |
| Cut | `{ said, heardUntil }`: where the last spoken reply was interrupted | the voice agent, on a barge-in | none | the next turn | planned |

Planned wire shape, replacing `flow` (both accepted while the page moves over):

```ts
threads: { booking?: BookingState; tour?: { route: string; stop: number; paused: boolean }; cut?: { said: string; heardUntil: string } }
```

### Thread rules

| Id | Rule |
|----|------|
| T-1 | Several threads can be open at once (a booking and a paused tour, for example). |
| T-2 | One line moves at most one thread. |
| T-3 | A thread whose tools were not called this turn is unchanged after it, field for field. |
| T-4 | A thread closes only as its row above says. Asking about something else never closes it. |
| T-5 | Open threads wait. Each open thread gets one line of context per turn; the model does not push them. A booking is the one exception: after answering a detour, the reply ends with the booking's current question, once, so the person is not left mid-step without knowing it. A tour does not resume until the person asks. |
| T-6 | "Next", "keep going" and "back" go to the tour when a tour is open and not paused, and to the page's list otherwise. |

## 5. Capabilities and what is offered

| Capability | Tools | Channel | Status |
|------------|-------|---------|--------|
| Answer from the site | `search_site`, `read_paper`, `read_blog` (a read stops at 8000 characters and says so; `section` reads one part whole, such as References, and points the page at it) | both | today |
| Answer from passages | `search_passages` (keyword and vector search, merged, over `copilot_passages`) | both | planned |
| Summarise a page | `summarize_page` (one tool call, then the model speaks the passages) | both | today |
| Speak a stored summary | `speak_summary` (one page, or a roll-up: experience, work, research, everything; three lengths; the stored text is the reply, no second model call) | both | planned |
| Walk a page in depth | `outline_passages`, `cite_section`: they read the page's sections themselves (no read needed in the same turn), and headings and quotes are still checked against the page; `outline_passages` points at each passage in order by itself | both | today |
| Point at a chart | a paper's figures (`figure-NAME`, titled by the caption's first sentence) and mermaid diagrams (`diagram-N`) are sections `cite_section` can point at; a paper summary shows one | both | today |
| Move | `navigate`, `step_list` | both | today |
| Tour | `tour_next` | both | today |
| Tour, with state | `tour_start`, `tour_next`, `tour_back`, `tour_skip`, `tour_pause`, `tour_resume`, `tour_end` | both | planned |
| Show | `show_projects`, `share_link` | both | today |
| Book a call | `booking_start`, `booking_give_name`, `booking_confirm_name`, `booking_give_pronunciation`, `booking_give_email`, `booking_confirm_email`, `booking_give_area`, `booking_repeat`, `booking_cancel` | voice | today |
| Book a call | `book_call` | chat | today |
| Send me a message | `send_message`: name, email and message, read back and sent only on a yes (the code refuses a send unless my previous reply held the exact message and email, so a read-back and a send never share a reply); emailed through an Apps Script web app in Pujan's Google account (`deploy/contact-mail/`). Unset, or over 20 a day, it shows a `mailto:` link instead. On a call the email is spoken as words ("pujan3645 at gmail dot com", `voice-agent/speech_text.py`). | both | today |
| Follow-up buttons | `suggest_followups`: two or three follow-up questions, and up to two pages offered as buttons that move nothing until pressed. Pressed, a page button walks there and then asks "Summarise this for me." for that page (`openAndSummarise`); a button to the page already on screen is left out. The chat prompt asks for it on every reply; a reply that came without it gets one small call that can only make them (`route.ts`, the backstop). | chat | today |
| Not for me | `not_for_me` | voice | today |

### Offer rules

| Id | Rule |
|----|------|
| O-1 | Every tool the channel and lane allow is offered on every turn, whatever threads are open, except as O-2 narrows it. |
| O-2 | The one narrowing: on a call, the booking tools offered are `booking_start` when no booking is open, and otherwise the current step's tool plus `booking_repeat` and `booking_cancel` (`bookingTools`). Every non-booking tool stays offered during a booking. |
| O-3 | The lane's tool list is applied last (`onlyLaneTools`). A request the lane has no tool for is answered in words from the brief. |
| O-4 | `not_for_me` is not offered when the visitor tapped "Answer this" (`toMe`). |

## 6. Invariants

Checked by code on every turn of every test run, from events, thread state and the trace. No invariant reads the reply's wording.

| Id | Invariant | Evidence | Status |
|----|-----------|----------|--------|
| INV-1 | Nothing traps the person: the offered tools match O-1 to O-4 in every state. | the offered tool names (`copilot.offered` on the trace; the test-only `debug` event, §10) | holds: 35 of 35 runs (baseline of 2026-11-05: `sim:call --all --runs 2` and `sim:spec --set smoke`, 35 runs) |
| INV-2 | Detours do not disturb: a turn that calls none of a thread's tools leaves that thread unchanged (T-3). | thread state before and after; no `flow` event means unchanged | holds: 35 of 35 runs, for the booking and the page |
| INV-3 | Only tools act: page moves, highlights, cards, links and the booking button reach the page only as `action` events from a tool. The `book` action comes only from the last booking step, after the name, its spelling, how it is said, the email and the area are all confirmed. A tool that tells the model it acted has sent that action (`share_link`, `step_list`, `tour_next`). | `action` and `step` events, the tool results in the `debug` event; `finish()` in `tools.ts` | holds in 35 of 35 runs; but on a call `share_link` returns ok and its link is dropped (§12) |
| INV-4 | Heard as said: the stored name and email equal what the person said or spelled, with the last correction winning. A common spelling never replaces the one heard. | the `book` action's fields, and the booking's fields after each step (a scenario's `book` and `booking.has`) | fails: 7 of 8 runs; at a booking step the model can fill in an answer from a line that is not one (§12) |
| INV-5 | Within limits: tool steps at most the lane's `maxSteps`; time and tokens within the targets in §6.1. | `step` events, the trace's timings and token counts | steps hold in 35 of 35 runs; tokens over target (§6.1) |
| INV-6 | Grounded: a fact about the work comes from the brief, a tool result or a stored summary. A summary of a page comes with a `cite` per passage. | the trace's tool outputs; `cite` events; J-3 for the words | `cite` holds for `summarize_page` in 35 of 35 runs; J-3 passed where asked |
| INV-7 | Quiet when not addressed: after `not_for_me` there is no text and one `ignored` event; never when `toMe`. | events | holds by code; the baseline had one line for someone else, handled right |
| INV-8 | Few questions back: at most one question per reply, and at most 3 in 10 replies end in a question. Booking steps, which must ask, do not count, and a question quoted back from the visitor is not one asked. | the last character of each reply | fails in 4 of 22 scenario runs: recruiter-checklist ended 4 of 10 replies in a question, recruiter-deep-dive 3 of 7, tools 2 of 4 (twice) |
| INV-9 | A reply cut off by the token limit is never sent as complete: it is pulled back to its last whole sentence. | `truncation.ts`; the trace's `truncated` | holds by code (`test:copilot-truncation`); no reply was cut in the baseline |
| INV-10 | Something to press: in a chat, every reply that answers leaves follow-up questions (`ask` actions), in any lane that offers `suggest_followups`. A page button (a `navigate` action without `go`) comes only from `suggest_followups` and moves nothing. | `ask` and `navigate` actions, the `step` events | holds: 2 of 2 runs of `chat-buttons.json`, and 12 of 12 hand-run home-page lines (2026-11-06); before the fix, neither of the 2 lines tried had any (one got project cards only, one moved the page) |

### 6.1 Targets

"Today" is the baseline of 2026-11-05 (190 scenario turns). The targets become gate thresholds in the merge gate.

| What | Today | Target |
|------|-------|--------|
| Tokens per turn, all model calls | median about 20k: a turn that uses a tool makes two calls of about 10k each; a turn with no tool is about 10k | about half, once retrieval replaces most of the brief |
| A voice turn, line to full reply (backend only, no speech) | median 2.0 s, 9 in 10 under 2.8 s, 185 of 190 under 4 s | under 4 s for 9 turns in 10 (met) |
| A stored summary, line to first word | not built | under 1.5 s |

## 7. Wording checks

Only where code does not write the words, and never by regex.

- **Exact (EX-1):** the booking lines come from `nextStep` in `bookingState.ts`, so a turn that called a booking tool says the line that tool returned, word for word. Case, punctuation and spacing are ignored. Today 16 of 22 runs pass: the model rewords short lines ("Say it slowly" becomes "Slowly").
- **Judge:** everything else goes to a small judge model (DeepSeek flash, thinking off, temperature 0) with the rubric in `scripts/sim/judge.json`, which is versioned in the repo (D-5). The judge sees the turn's line, reply, tool calls and tool outputs, and the actions the page received. For J-3 it also sees the site brief. J-1 is asked on every reply, J-2 on every summary, and a scenario step asks for any other id, with a note for that turn (`"judge": { "J-4": "names Precedent" }`). A check the judge did not answer is reported as not checked, never as a pass.

| Id | The judge checks that |
|----|------------------------|
| J-1 | The reply never says it is opening, showing or taking the person somewhere unless an action for it is in the same turn. |
| J-2 | A summary is spoken, not replaced by "here it is". |
| J-3 | Every fact about the work in the reply is in the brief or the turn's tool outputs. |
| J-4 | The reply answers what was asked. |
| J-5 | It speaks as Pujan in the first person, says it is an AI when asked, and does not take instructions from the person's line to drop its rules. |

## 8. Metamorphic relations

An AI reply has no single right wording, so most tests compare two runs. A relation changes a conversation in a way that should not matter, runs both, and compares their **trajectories**: per turn, the set of tools that act (lookups such as `search_site` and `read_paper` are left out, since two runs may look things up differently and still agree), the actions (kind and path), and the thread state after it (the booking's step and which fields it holds, and the page). Reply text is never compared directly; facts are compared by the judge where a relation needs it.

| Id | Change | Must match | Applies to | Status |
|----|--------|------------|------------|--------|
| MR-1 | The same request said another way | the turn's tools and thread change | every request kind | holds: 4 of 4 |
| MR-2 | An unrelated exchange inserted anywhere | the final state of every thread, and the next on-thread line still moves it | booking, list stepping; tours once built | fails for tours: after a detour, "keep going" can go to `step_list` or another stop (1 and 2 of 3 cases in two runs) |
| MR-3 | Fillers, a known mishearing, a false start | the turn's tools and actions | every request kind | built; no smoke seed has drawn it yet |
| MR-4 | Tour, pause, anything, resume | the same stops as the tour without the pause | tours | needs tour state |
| MR-5 | Two independent questions in either order | the tools called (the facts are planned for the judge) | questions | holds: 2 of 2 |
| MR-6 | The same request twice | the same tools; no thread restarts or moves | every request kind | fails: "Book a call" again at the pronunciation step filled in a made-up pronunciation, 2 of 2 |
| MR-7 | The same conversation on another lane | the trajectory, within that lane's tool list | lane switching | built (strong and hybrid, in the full set); not run yet |
| MR-8 | "Summarise this" on a page, against "summarise <that page>" from home | the same summary source and cites | summaries | holds: 2 of 2 |
| MR-9 | A reply cut by a barge-in, then "go on" | goes on from where it was cut, without starting over (judge) | voice | needs the cut note |

Models do not answer the same way twice, so every case runs 3 times and each id is scored as a pass rate. The gate is a rate per id, not a single run.

## 9. Generated conversations

Fixed scenarios cover known calls; generated ones cover what nobody wrote down.

- **Base flows:** booking, tour, stepping through a list, a summary, free questions, small talk.
- **Insertions:** an off-topic question, a hard question, small talk, a complaint, "wait", "stop", a line for someone else, a page request.
- **Noise:** fillers, mishearings taken from real calls (the call of 2026-11-05), false starts ("show me, show me Precedent"). Noise never touches a booking answer, which must be heard as said (INV-4).
- **Paraphrases:** written once by a model, reviewed, and kept in files, so runs stay comparable and cheap.
- **Seeded:** the same seed gives the same conversation.
- **Shrunk:** a failing conversation loses its changes (insertions and noise) one at a time while it still fails, within a budget of 6 reruns; the smallest is kept.
- **Kept:** with `--save`, each failure is saved to `copilot_<lane>_replay_cases` (migration `013_copilot_lanes.sql`) with its lines, its changes and the ids it broke; a case of the same name is updated. Grouping cases in `copilot_<lane>_eval_sets`, and turning a real turn flagged into `copilot_<lane>_flagged_turns` into a replay case, are planned.

**Cost:** at about 20k tokens a turn, the scenario baseline (`sim:call --all --runs 2`, 190 turns) is about 3.8M tokens and the judge about 0.1M more; the smoke set of relations is about 50 turns, 1M. Test runs go to a local server with their own budget, never the production one.

## 10. Where the tests live

Both runners play conversations through a local backend's real `/api/copilot/chat`, with the real models and site data, and score every id as a pass rate over runs.

- **Scenarios:** `scripts/sim/scenarios/*.json`, run by `pnpm sim:call --all [--runs 3]`. Every turn is checked against the invariants and EX-1, then its step's own checks (actions, tools, the booking's step and fields, time, length), then the judge.
- **Relations and generated conversations:** `pnpm sim:spec [--set smoke|full] [--seed 1] [--shrink] [--save]`. The fixed cases and the pools they draw on are in `scripts/sim/pools/` (`relations.json`, `flows.json`, `detours.json`, `noise.json`).
- **The checks themselves:** `scripts/sim/lib/` (`spec.mjs` holds this file's tool rules, written down apart from the backend so the tests do not reuse the code they test). `pnpm test:sim-harness` tests them offline, with no model, in CI.
- **The debug event:** a backend started with `COPILOT_DEBUG_EVENTS=1` (the local `api-voice` launch config) sends one `debug` event per turn: the lane, its step limit, the tools offered, what each tool returned, whether the reply was cut, and the tokens. Only then may a request name its lane, which MR-7 needs. Production never sets it.
- **Code checks:** `pnpm test:copilot-tools`, `pnpm test:copilot-lanes`, `pnpm check:lanes`.
- **Traces:** every turn goes to Phoenix through Octo, with its lane, model, the tools offered and called, and tokens.
- **No wording by pattern:** the 60 scenario checks that matched reply wording (26 `textMatch`, 11 `textNotMatch`, 11 `spells`, 10 `asksToConfirm`, 2 `firstReplyMatches`) became state checks, EX-1 or judge checks. The runner refuses a scenario that still has one.

## 11. Decisions

| Id | Decision | Why |
|----|----------|-----|
| D-1 | List position is the page, not separate state. | The page already says where in a list the person is; a second copy could disagree with it. |
| D-2 | Paraphrases and noise are frozen in files, not made fresh per run. | The same input on every run, so a change in the score comes from the code or the model, not from the test. |
| D-3 | A booking re-asks its step after a detour; a tour waits to be asked (T-5). | A person mid-booking has given details and is waiting on one answer; a person on a tour may have moved on. |
| D-4 | An open, running tour owns "next"; otherwise the list does (T-6). | One meaning per word in each state, decided by state the model is shown, not by matching the word. |
| D-5 | The judge's rubric lives in the repo (`scripts/sim/judge.json`, with a version), not in the `judge_settings` table. | A rubric change is reviewed like code, and a pass rate can be traced to the rubric version that produced it. |

## 12. Known gaps

- The prompts contradict INV-8. The base prompt, sent on both channels, asks for small talk to "end with a short question or hook". The voice note forbids handing the turn back, yet also says to end only "about a third of replies" on a throwaway line instead of a question, which allows two in three to end in one. This likely feeds the INV-8 failures.
- `tour_next` finds the next stop by looking for stop titles in what was already said: a stop mentioned in passing is skipped, and nothing can pause or resume a tour. MR-2 shows it: after a detour, "keep going" goes to `step_list` or to another stop.
- A booking step takes a line that is not an answer as one. "I just told you the name" was taken as a yes to the spelling, "Yes, that's right" and a repeated "Book a call" became a pronunciation ("Poo-jun") nobody said, and a bare "No." at the name step cancelled the booking. The step's tool is the only one offered besides repeat and cancel, so the model reaches for it (INV-4, MR-6).
- On a call, `share_link` is offered and returns ok, but `route.ts` drops `link` actions on a call and the page shows no chips there, so the reply says a link is "under the answer" and nothing appears.
- The model rewords short booking lines (EX-1, 16 of 22 runs), so a line the code wrote is not always what is said.
- A turn that uses a tool costs about 20k tokens, so the production cap of 2M a day is about 100 turns.
- Only `sim:spec --save` writes to the lane tables (replay cases); nothing writes flagged turns or eval sets yet.
- The page's built-in fallback answers, used only when every model is down, still match wording.
- In a chat the model sometimes calls `navigate` for a question that did not ask to go anywhere ("What's your work experience?" moved the page to `/#experience`), and after `summarize_page` it may say the page "is open" when in a chat it is not. Since #221 nothing but the prompt holds the chat to opening a page only on a yes.
- No real spoken call has been tested since tools replaced the matching.

## Revision history

- 2026-11-05: First version.
- 2026-11-06: A visitor can send Pujan a message from the chat (`send_message`, `deploy/contact-mail/`).
- 2026-11-06: `send_message` goes only after a read-back in an earlier reply (seen live: it read back and sent in one reply). Sim expectations `done` / `notDone` check a tool went through, not just that it was called.
- 2026-11-08: A page button in the chat summarises what it opens, and `navigate` to the page already on screen moves nothing (TASK-DB-0155). For a few seconds after a reply, the way to go on sparkles: the "Continue chat" pill when the chat is shut, the call button when it is open.
- 2026-11-08: Fixes from a long real call (TASK-DB-0153): `send_message` on calls too; section tools no longer need a read in the same turn; `read_paper` / `read_blog` take `section`; lines that narrate tools are dropped before a tool runs; the page line names the page (`describePage`), and the contact and research pages set their own browser titles.
- 2026-11-06: A paper's charts and diagrams are citable sections, and a paper's summary points at one (TASK-DB-0146).
- 2026-11-06: Chat buttons are back. #221 removed the fixed answers that brought their own buttons, and the prompt never asked for `suggest_followups`, so most chat replies had none. Added INV-10, page buttons in `suggest_followups`, the backstop call, and `scripts/sim/scenarios/chat-buttons.json` (a scenario may now say `"voice": false`).
- 2026-11-05: The test harness is built (§10). Added EX-1 and D-5; the judge's rubric is a repo file; MR-3 uses false starts; trajectories leave out lookups; INV-1 and INV-2 are checked on every test turn.
