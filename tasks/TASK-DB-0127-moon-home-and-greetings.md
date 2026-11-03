# TASK-DB-0127: varied saved replies, spoken typed greetings, a moon that watches the chat

## Goal
The saved (instant) replies stop reading the same every time, a greeting typed during a call is answered aloud as well as in chat, and the moon reacts a little and pays attention when the chat is open.

## Done
- `backend/src/copilot/answers.ts`: `vary(key, options)` picks a wording and never the one used last for that key. Every saved reply now has 2 to 4 wordings: greetings (a separate set after the first turn, so "hi" then "hello" is not the same line twice), how are you, real or fake, capabilities, thanks, bye, identity, contact, tour (chat and each voice passage), blog, research, experience, projects, book, a project's "Tell me about", and the four service answers. Project answers still start with the title (the test relies on it).
- `public/voice/hello-*.m4a`: recordings of the seven greeting wordings. `holdAudio.ts` maps the exact text to its clip; `voice.ts` plays it when a typed greeting is answered during a quiet call (nobody speaking, not thinking) and shows the line in the moon's bubble with the talking mouth. Other typed replies stay text only: speaking arbitrary text needs the voice agent (separate repo).
- Moon: small reactions ("wheee!", "hehe", "eek!", "ooh!") in the bubble, about one in five also aloud (`public/voice/quip-*.m4a`), never while it speaks, the chat is open, or someone is talking. While the chat is open it sits beside the composer (on a phone, on the sheet's edge), looks at it, and does not wander, flee, make faces or get pulled into the sky body. It is placed at once on mount.
- `think-long` and the greeting clips were re-rendered after an apostrophe broke the render command (silent clips).

## Evidence
`pnpm --dir backend run build`, `node scripts/test-copilot-answers.mjs`, tsc and eslint pass. Checked in the browser: the moon sat on the open sheet's edge.

## Next
- The moon leaving the orb on connect and returning on hang up (needs the orb restructured).
- Typed answers spoken in general: needs a "say this" message to the voice agent in the chatbots repo.
