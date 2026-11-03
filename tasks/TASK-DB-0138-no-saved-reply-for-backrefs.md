# TASK-DB-0138: a question about the conversation never gets a saved reply

## Goal
After the first turn, a question that refers back to the conversation goes to the model, not to a saved intent or a routine.

## Found
Live test on main: after 16 messages, "And what was the first project we talked about?" got the instant `intent:projects` reply (the keyword `project` settled the intent) instead of the model recalling Precedent.

## Done
- `refersBack()` in `backend/src/copilot/answers.ts` (we talked/discussed/mentioned, you said/mentioned/told, I said/told/asked, what did I, earlier, last time, previously, the first/last/previous one, that one, again...). `cachedAnswer` and `routeRequest` return null when it is true and it is not the first turn. A short yes or no to an offer is still read first. First-turn behaviour is unchanged.
- Regression cases in `scripts/test-copilot-answers.mjs` and `scripts/test-copilot-router.mjs`, including "What did I say I do for work?" (must reach the model) and "Tell me about your projects" (stays instant, first turn and later).

## Evidence
Backend build, router, answers and news tests, eslint and `find-orphans --strict` pass. Not rerun against live models.

## Notes
"before" and "again" alone are matched only in the forms listed, so "what did you do before Nepasoft" stays instant.
