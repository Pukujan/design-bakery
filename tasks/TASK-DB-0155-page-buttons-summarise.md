# TASK-DB-0155: A page button summarises what it opens; the way to go on sparkles

**Goal.** The owner pressed "See full experience" under a chat answer: the moon walked to Roles and nothing more was said. Pressing a page button should always walk there and then summarise it. After each reply, the button to keep talking should sparkle for a moment, so visitors see they can go on. The owner also said to stop asking before PRs, merges and deploys.

**Found.** The 15:23 UTC turn ("What experience do you have?", chat) answered and offered `/#experience` as a `suggest_followups` page button. A page button only called `copilot.guide`: a walk, no request.

**Done.**
- `store.ts` `openAndSummarise(path)`: walk there (`guide`), then send "Summarise this for me." with the button's own path (with its section). `CopilotChat.tsx`: page, project and internal link buttons use it.
- `tools.ts`: `navigate` to the page already on screen moves nothing; `suggest_followups` leaves out a page button to the page on screen. `route.ts`: a summary never moves the page.
- `replyPeek.ts` `useReplyNudge`: true for 4.5 s after a text reply ends (not on a call, not after an error, not for saved replies). `CopilotDock.tsx` pill and `MoonCallButton.tsx` carry `data-nudge`; `copilot.css` pulses a ring and bursts three sparks (a still ring for reduced motion).
- `AGENTS.md` § Shipping (and the owner's global instructions): an asked-for change is approved to PR, merge and deploy without asking.
- `scripts/test-copilot-chips.mjs`: page chips call `openAndSummarise`, which walks first and then sends.

**Evidence.**
- Local API (Haiku), "Summarise this for me." after the experience answer: on `/#experience` a three-role summary, no move; on `/work/precedent` and a paper, cites in order and no button to the same page; on `/research` a short list answer and a button to one paper.
- Headless Chromium on the dev server: after "What experience do you have?" the call button sparkled (gone 5.5 s later); pressing "See full experience" walked to Roles, sent the request, the summary showed in the moon's bubble and the "New reply" pill sparkled.
- Copilot tests pass (order, lanes, tools, memory, exempt, stream, truncation, chips, cite, voice); frontend tsc and eslint clean.

**Not done.**
- On a phone the chat sheet closes for the walk, so the summary shows in the pill bubble, not the open chat.
