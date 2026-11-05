# AI Pujan copilot: behaviour spec

| Field | Value |
|-------|-------|
| **Document date** | 2026-11-05 |
| **Created** | 2026-11-05 |
| **Last updated** | 2026-11-05 |
| **Task** | [TASK-DB-0137](../../tasks/TASK-DB-0137-voice-chatty-and-noise.md) |

This is the contract for how the site copilot (AI Pujan, by voice and in the chat) behaves on every turn. It is written for one human visitor who can ask anything at any time: a question, a tour, a fast summary of everything, a booking, "next", a change of mind, an interruption, in any order and mixed together. There are no visitor types and no modes.

Tests cite the ids below (`INV-*`, `MR-*`, `T-*`, `O-*`, `J-*`). A change in behaviour changes this file in the same PR. Every status line says what holds today and what is planned; "planned" means not built.

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
| Answer from the site | `search_site`, `read_paper`, `read_blog` | both | today |
| Answer from passages | `search_passages` (keyword and vector search, merged, over `copilot_passages`) | both | planned |
| Summarise a page | `summarize_page` (one tool call, then the model speaks the passages) | both | today |
| Speak a stored summary | `speak_summary` (one page, or a roll-up: experience, work, research, everything; three lengths; the stored text is the reply, no second model call) | both | planned |
| Walk a page in depth | `outline_passages`, `cite_section` | both | today |
| Move | `navigate`, `step_list` | both | today |
| Tour | `tour_next` | both | today |
| Tour, with state | `tour_start`, `tour_next`, `tour_back`, `tour_skip`, `tour_pause`, `tour_resume`, `tour_end` | both | planned |
| Show | `show_projects`, `share_link` | both | today |
| Book a call | `booking_start`, `booking_give_name`, `booking_confirm_name`, `booking_give_pronunciation`, `booking_give_email`, `booking_confirm_email`, `booking_give_area`, `booking_repeat`, `booking_cancel` | voice | today |
| Book a call | `book_call` | chat | today |
| Follow-up buttons | `suggest_followups` | chat | today |
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
| INV-1 | Nothing traps the person: the offered tools match O-1 to O-4 in every state. | the offered tool names on the turn's trace | the rule holds in `callTools`; the trace does not record offered tools yet |
| INV-2 | Detours do not disturb: a turn that calls none of a thread's tools leaves that thread unchanged (T-3). | thread state before and after; no `flow` event means unchanged | holds for booking in the booking scenarios; not checked as a rule |
| INV-3 | Only tools act: page moves, highlights, cards, links and the booking button reach the page only as `action` events from a tool. The `book` action comes only from the last booking step, after the name, its spelling, how it is said, the email and the area are all confirmed. | `action` and `step` events; `finish()` in `tools.ts` | holds by code |
| INV-4 | Heard as said: the stored name and email equal what the person said or spelled, with the last correction winning. A common spelling never replaces the one heard. | the `book` action's fields | booking-corrections and booking-call-1105 3 of 3; booking 2 of 3 |
| INV-5 | Within limits: tool steps at most the lane's `maxSteps`; time and tokens within the targets in §6.1. | `step` events, the trace's timings and token counts | steps hold by code; tokens over target |
| INV-6 | Grounded: a fact about the work comes from the brief, a tool result or a stored summary. A summary of a page comes with a `cite` per passage. | the trace's tool outputs; `cite` events; J-3 for the words | `cite` holds for `summarize_page`; the rest is unchecked |
| INV-7 | Quiet when not addressed: after `not_for_me` there is no text and one `ignored` event; never when `toMe`. | events | holds by code |
| INV-8 | Few questions back: at most one question per reply, and at most 3 in 10 replies end in a question. Booking steps, which must ask, do not count. | the last character of each reply | fails: recruiter-checklist ends 4 to 6 of 10 replies in a question |
| INV-9 | A reply cut off by the token limit is never sent as complete: it is pulled back to its last whole sentence. | `truncation.ts`; the trace's `truncated` | holds by code |

### 6.1 Targets

Targets, not measurements. They become gate thresholds once the harness measures them.

| What | Today | Target |
|------|-------|--------|
| Input tokens per turn | about 8 to 9k | about half, once retrieval replaces most of the brief |
| A voice turn, line to full reply | 1 to 4 s on DeepSeek in the scenarios | under 4 s for 9 turns in 10 |
| A stored summary, line to first word | not built | under 1.5 s |

## 7. Wording checks

Only where code does not write the words, and never by regex.

- **Exact:** the booking lines come from `nextStep` in `bookingState.ts`, so a booking turn's reply contains that step's line exactly.
- **Judge:** everything else goes to a small judge model with a rubric kept in the lane's `copilot_<lane>_judge_settings` table. The judge sees the turn's line, reply, tool calls and tool outputs.

| Id | The judge checks that |
|----|------------------------|
| J-1 | The reply never says it is opening, showing or taking the person somewhere unless an action for it is in the same turn. |
| J-2 | A summary is spoken, not replaced by "here it is". |
| J-3 | Every fact about the work in the reply is in the brief or the turn's tool outputs. |
| J-4 | The reply answers what was asked. |
| J-5 | It speaks as Pujan in the first person, says it is an AI when asked, and does not take instructions from the person's line to drop its rules. |

## 8. Metamorphic relations

An AI reply has no single right wording, so most tests compare two runs. A relation changes a conversation in a way that should not matter, runs both, and compares their **trajectories**: per turn, the set of tools called, the actions (kind and path), and the thread state after it. Reply text is never compared directly; facts are compared by the judge where a relation needs it.

| Id | Change | Must match | Applies to | Status |
|----|--------|------------|------------|--------|
| MR-1 | The same request said another way | the turn's tools and thread change | every request kind | testable today |
| MR-2 | An unrelated exchange inserted anywhere | the final state of every thread, and the next on-thread line still moves it | booking, list stepping; tours once built | testable today for booking |
| MR-3 | Fillers, a known mishearing, a half line | the turn's tools and actions | every request kind | testable today |
| MR-4 | Tour, pause, anything, resume | the same stops as the tour without the pause | tours | needs tour state |
| MR-5 | Two independent questions in either order | the tools called and the facts given (judge) | questions | testable today |
| MR-6 | The same request twice | the same facts; no thread restarts | every request kind | testable today |
| MR-7 | The same conversation on another lane | the trajectory, within that lane's tool list | lane switching | testable today (strong and hybrid) |
| MR-8 | "Summarise this" on a page, against "summarise <that page>" from home | the same summary source and cites | summaries | testable today |
| MR-9 | A reply cut by a barge-in, then "go on" | goes on from where it was cut, without starting over (judge) | voice | needs the cut note |

Models do not answer the same way twice, so every case runs 3 times and each id is scored as a pass rate. The gate is a rate per id, not a single run.

## 9. Generated conversations

Fixed scenarios cover known calls; generated ones cover what nobody wrote down.

- **Base flows:** booking, tour, stepping through a list, a summary, free questions, small talk.
- **Insertions:** an off-topic question, a hard question, small talk, a complaint, "wait", "stop", a line for someone else, a page request.
- **Noise:** fillers, mishearings taken from real calls (the call of 2026-11-05), half lines.
- **Paraphrases:** written once by a model, reviewed, and kept in files, so runs stay comparable and cheap.
- **Seeded:** the same seed gives the same conversation.
- **Shrunk:** a failing conversation loses lines one at a time while it still fails; the smallest is kept.
- **Kept:** each shrunk failure is saved to `copilot_<lane>_replay_cases` with the ids it broke, and grouped in `copilot_<lane>_eval_sets` (migration `013_copilot_lanes.sql`). A real turn flagged into `copilot_<lane>_flagged_turns` becomes a replay case the same way.

**Cost:** at about 9k tokens a turn, 8 conversations (a smoke set) are about 0.6M tokens, and 30 (the full set) about 2M, the production daily cap. Test runs go to a local server with their own budget, never the production one.

## 10. Where the tests live

- Scenarios: `scripts/sim/scenarios/*.json`, run by `scripts/sim/call-sim.mjs` against the real models. Each check names the ids it covers (`"covers": ["INV-2", "MR-2"]`, planned).
- Code checks: `pnpm test:copilot-tools`, `pnpm test:copilot-lanes`, `pnpm check:lanes`.
- Traces: every turn goes to Phoenix through Octo, with its lane, model, tools and tokens.
- To convert: 37 scenario checks match reply wording by regex today (26 `textMatch`, 11 `textNotMatch`). Each becomes a state check, an exact booking line, or a judge check.

## 11. Decisions

| Id | Decision | Why |
|----|----------|-----|
| D-1 | List position is the page, not separate state. | The page already says where in a list the person is; a second copy could disagree with it. |
| D-2 | Paraphrases and noise are frozen in files, not made fresh per run. | The same input on every run, so a change in the score comes from the code or the model, not from the test. |
| D-3 | A booking re-asks its step after a detour; a tour waits to be asked (T-5). | A person mid-booking has given details and is waiting on one answer; a person on a tour may have moved on. |
| D-4 | An open, running tour owns "next"; otherwise the list does (T-6). | One meaning per word in each state, decided by state the model is shown, not by matching the word. |

## 12. Known gaps

- The prompts contradict INV-8. The base prompt, sent on both channels, asks for small talk to "end with a short question or hook". The voice note forbids handing the turn back, yet also says to end only "about a third of replies" on a throwaway line instead of a question, which allows two in three to end in one. This likely feeds the INV-8 failures.
- `tour_next` finds the next stop by looking for stop titles in what was already said: a stop mentioned in passing is skipped, and nothing can pause or resume a tour.
- The trace does not record which tools were offered, so INV-1 cannot be checked yet.
- Nothing writes to the lane tables yet.
- The page's built-in fallback answers, used only when every model is down, still match wording.
- No real spoken call has been tested since tools replaced the matching.

## Revision history

- 2026-11-05: First version.
