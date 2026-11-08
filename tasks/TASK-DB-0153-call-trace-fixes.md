# TASK-DB-0153: Fixes from the first long call on our voice worker

**Goal.** The owner's call of 2026-11-08 (05:00 to 05:20 UTC, room `db-call-17221d66`, Phoenix session `a5c2ed89…`, 44 turns) had several problems, and the moon still missed when it should follow. Fix them in this repo.

**Found (Phoenix, through Octo's `otel/read/spans`).**
1. **No greeting.** `copilot.greet` failed in 56 ms with "Application error in method handler": the page refused it because it had not yet seen the worker join (`isAgent`). The first turn then took 15.4 s and had no call id.
2. **The moon stayed put while a paper was explained.** `outline_passages` was refused ("not retrieved this turn") in every paper walk. It ran in the same step as `read_paper`, so the read had not landed yet, or the paper had been read a turn earlier. In four of five walks no section was pointed at.
3. **References out of reach.** "Show me references" three times: `read_paper` stops at 8000 characters, before a long paper's References.
4. **Spoken narration.** "The visitor says "give me one more" on the blog list, and "next" means step_list." and "I need to read the paper before I can point at its sections" were said aloud.
5. **Which page?** On /contact the copilot said three times that the visitor was on the paper they had left. The page line sent `document.title`, which is the same site-wide title on most pages, so it said nothing; the history was about the paper.
6. **Message could not be sent.** The caller gave a name, an email and a message, said yes, and heard that messaging was not available: `send_message` is not offered on a call, and the call returned nothing.
7. **Email said badly.** The caller heard "g gmail": the address went to the voice as written, and the sentence splitter cut it at the dot.
8. **False stalls.** 10 `speech-without-turn` failures; 7 were while the copilot itself was speaking (speech over its voice that did not interrupt it). Each one cleared the user turn.

**Done.**
- `frontend/.../voice.ts`: the greeting waits up to 2 s for the worker to be known (`fromAgent`); `voice-agent/agent.py` tries the greeting once more after 1 s.
- `backend/src/copilot/tools.ts`: `cite_section` and `outline_passages` read the page's sections themselves (headings and quotes are still checked against the page); `outline_passages` emits the cites itself, as `summarize_page` does. `read_paper` / `read_blog` take `section` to read one part whole (and point the page at it); a cut read says so. `citations.ts` comment updated.
- `backend/src/copilot/knowledge.ts` `describePage`, used in `route.ts`: the page line now says "Right now the visitor is on /contact, the Contact page. Earlier messages may have been on other pages…".
- `backend/src/copilot/textFilter.ts`: a line before a tool call that names a tool or talks about "the visitor" is dropped; "Let me open the research page." stays.
- `route.ts`: `send_message` is offered on a call (it still sends only after a read-back answered yes); prompt lines on tools, references and messages.
- `voice-agent/speech_text.py` `spoken()`: an email is said as "pujan3645 at gmail dot com"; used for every line the worker says.
- `agent.py`: the stall watchdog skips `speech-without-turn` while the copilot is speaking.

**Evidence.**
- `test-copilot-cite.mjs` (new: unread paper is pointed at, outline emits one cite per passage in order, read section text and pointer), `test-copilot-stream.mjs` (7 cases, two new), `tools`, `truncation`, `chips`, `lanes`, `memory`, `cite-route`, `test-copilot-voice.mjs` pass. `voice-agent` unit tests: 16 pass (`tests/test_speech_text.py` new). Frontend `tsc --noEmit` and eslint clean. `test:copilot-news` fails on main too.
- The call's turns replayed against a local API with these changes (Haiku): "guide me through it" on db-r-2026-007 emitted 4 cites in reading order; "Show me references" read the References section, pointed at it and named three in a sentence; on /contact after a paper, "Which page am I on" said the Contact page; the message read back name, email and message and asked to send; "Give me one more" on /blogs/33 went to the next post with no narration.

**Not done.**
- The worker changes (greeting retry, stall skip, `spoken`) are tested by unit tests only; check the next real call in Phoenix (`voice.failure` with `method = copilot.greet`, `stall`).
- Three stalls happened while the copilot was listening; their cause is not known.
- Replies queued while the copilot was still speaking leave no `voice.turn` span (the span is written when the voice starts); not fixed.
- Choosing which section a free-form answer drew on is PR #205's `cite.ts`.
