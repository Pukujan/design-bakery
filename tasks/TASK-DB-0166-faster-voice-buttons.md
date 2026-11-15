# TASK-DB-0166: the chat's voice starts sooner, its buttons go somewhere, and the way back to the chat stays lit

**Goal.** Owner, 2026-11-15: "i wish he spoke on all his responses, his responses are a bit slow on audio why? also some of his buttons are weird, and dont take u anywhere, i wish all his replies took u somewhere, also why are the responses so slow?" Then: "i wish the continue chat button was always glowing", with something that shows, without words, that the chat goes on after a button has taken the visitor away from the hero. Then: the voice says "live" as in "to live" where it means "it is live"; is there a pronunciation helper, and tests for it?

**Found (www.design-bakery.com, browser pane at 1440 px, from the owner's network, which skips the human check and the limits).**
- Text: 2.1 to 3.1 s for a one-step reply, 6 to 8 s when the model also reads a page first (each model step is 2 to 3 s). `/api/copilot/health`: Claude Haiku answers 401 "Invalid Anthropic API Key" and the first DeepSeek seat 402, so every reply comes from the second DeepSeek seat. Haiku was put first (DB-0147) for 0.45 s to the first word.
- Voice: asked for only at `done`, and the gateway makes the whole clip before sending any of it, at about a quarter of its length: 2.2 s for a 7 s clip, 3.7 s for 11 s, 4.1 to 5.1 s for 17 to 19 s. The voice started 6.4 s after Enter on a short reply and 10.4 to 12.6 s after a click on a longer one.
- No typed reply stayed silent in these runs. What makes replies seem unspoken: any click or key stops the voice (2.9 of 10.4 s, 5.8 of 19 s, 3.1 of 17.4 s heard before the next button was pressed), and a button pressed before the clip arrives means it is never heard; "Jump to" buttons say nothing at all; a model move, an error and the built-in answers are not spoken.
- A kept summary came back in 0.17 s, between the moon's "let me find that one" and "there it is": once the reply clip started 40 ms before the "found" line and both played together.
- Buttons: a follow-up button sent the page as `/` wherever on the home page the visitor was, so under a reply in the work section the model offered "See the work" again: the moon walked nowhere and the same summary was sent a second time (it is twice in the owner's paste). A project's "sections" are three labels in one sidebar, so "Jump to What it is", "Jump to Built with" and "Jump to Go deeper" moved the page 155 px between them, silently.
- After a page button takes the visitor from the hero, the panel stays shut on desktop too (`guide` never opens it): the conversation is behind the small pill bottom right, which sparkled for 4.5 s and then looked like any other control.
- Pronunciation: there is no helper. The chat's voice only strips markdown (`spokenText`); the call's only says emails as words (`voice-agent/speech_text.py`).

**Done.**
- `speech.ts` `sentenceParts` + `registerReply`: a new reply of several sentences is made as a clip a sentence or two, in order (a long opening sentence is cut once more at its first colon, semicolon or dash). `done.speech` keeps `{ id, ready }` for the whole reply (a page from before this change, and kept replies) and adds `parts`. The whole clip is only made when asked for by its id.
- `holdAudio.ts` `speakReply(text, urls[])`: asks for all clips at once and plays them one after another; `walkQuiet` waits for the walk and its last line. `store.ts`: `go` resolves once "there it is" has started; `guide` marks the walk.
- `store.ts` `homeSectionPath`: a request from the home page says which section is on screen (`/#work`), so `suggest_followups` leaves out the button to it.
- `route.ts` `chatButton`: in a chat, a pointer at a project's sidebar section becomes one "Open <project>" button (none on that project's page), and a second button to the same place is dropped. `CHAT_NOTE` and the backstop ask for at least one page button on every reply: the place that shows what was just said.
- `speech.ts`: kept summaries are versioned (`SUMMARY_VERSION = 2`), so the ones kept with "Jump to" buttons are answered afresh.
- `copilot.css` + `CopilotDock.tsx`: while there is a conversation the pill carries `data-live`: it lands with two ripples, then breathes in the accent; with an unopened reply it is brighter and keeps sending a ring out. A still ring for reduced motion.
- `scripts/test-copilot-speech.mjs`: the cutting (nothing lost, decimals, a short sentence rides along), parts made in order, the whole-reply id still served.

**Evidence (before merge).** `pnpm test:copilot-speech`, `-chips`, `-tools`, `-stream`, `-cite` pass; backend and frontend `tsc` and eslint clean. No local API (no `backend/.env` on this Mac), so the page was not run locally.

**Not done.**
- The page does not move by itself on a reply: `SYSTEM` says not to open a page nobody asked about. Every reply now has a button that goes somewhere new; moving without a press is the owner's call.
- Pronunciation: nothing shipped. A respelling cannot be checked without ears (speech-to-text writes "live" either way).
- The Anthropic key (401) and the first DeepSeek seat (402) are the owner's to renew.
- PR #205 also edits `route.ts` and will need a rebase.
