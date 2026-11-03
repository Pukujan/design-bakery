# TASK-DB-0132: a greeting word no longer hijacks a question; idle nudges are rarer

## Goal
Two things found on the first real end-to-end voice call (a headless browser with a fake microphone playing "Hey there. Tell me about your projects."):
1. The question was answered with the greeting ("Hi, I'm AI Pujan. Want a tour...") because "hey" is a keyword that settles the intent outright, and the greeting came first in the list.
2. The idle nudges ("I can also help you book...", "I'm still here...", "Ask me about my research...") came every 10 to 20 seconds, which is the moon talking too much while idle.

## Done
- `backend/src/copilot/answers.ts` `bestIntent`: greeting and thanks keywords only count when no other intent has a keyword hit and the message is 3 content words or fewer. "hey there, tell me about your projects" is a projects question; "hey there" and "thanks!" are still a greeting and a thanks.
- `frontend/src/app/modules/copilot/holdAudio.ts`: a quiet call is nudged every 40 to 60 seconds, at most 3 times (was every 10 to 20 seconds, 4 times).
- `scripts/test-copilot-answers.mjs`: five cases for the above.

## Evidence
`pnpm --dir backend run build`, `node scripts/test-copilot-answers.mjs` and the frontend type check pass. The call itself ran against the local full app (live voice service, real LiveKit room, local API): connected, the moon left the card and the card dimmed, the spoken question reached the chat, the agent answered by voice.

## Not done
The call could not be run against the live site by automation: the live pass check uses Turnstile, which blocks automated browsers.
