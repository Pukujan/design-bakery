# TASK-DB-0107 — typed replies and small talk without a live model

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0107-live-typing-smalltalk` (from `main`) |
| **Status** | In review |

## Goal

With no live model (local dev, or the API away), "hello" got "I couldn't find that", and every answer popped onto the screen at once. The owner wants basic conversation from cached replies, and answers that look like the agent is thinking and typing.

## Done

- Small talk in the built-in index (`copilotAnswers.ts`): hello, how are you, are you real/AI, what can you do, thanks, bye. Wording matches the live service's cached replies. The live service already answers hello and thanks from `backend/src/copilot/answers.ts`, which reads the portfolio content from Octo with the repo JSON as fallback; the reply wording itself lives in code, not in the Octo database.
- Typed reveal in `copilot/store.ts`: dots for about 0.65 s, then the text appears a few characters at a time. A live model stream goes through the same queue and is barely slowed (speed rises with the backlog). Action chips appear after the text is typed. Stop and errors show what is queued at once. Voice turns skip it (`{ typed: false }`).

## Checks

- tsc, eslint, `test:copilot-answers` pass. Local dev server (no backend): sending "hello" shows the dots for about 0.65 s, then 124 characters typed over about 1.3 s.

## Not done

- Moving the cached reply wording into the Octo workspace database so it is editable without a deploy.
