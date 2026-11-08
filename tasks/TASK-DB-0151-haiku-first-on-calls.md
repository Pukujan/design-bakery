# TASK-DB-0151: Claude Haiku first on a call too

**Goal.** The owner wants Haiku as the first model everywhere, live calls included.

**Done.** `health.ts` `byHealth`: Haiku, when healthy, goes first. On a call the providers behind it are still ranked by measured reply time (TASK-DB-0137 #213), so before this a faster DeepSeek could take Haiku's place on a call. A failing Haiku still drops to the back. `additionals/doc/env.md` says so.

**Evidence.** `pnpm run test:copilot-truncation`: 9 groups ok; the new group 9 has Haiku first on a call while DeepSeek measures faster. The live call works end to end before this change: `voice-agent/scenarios.py --only 1,3,5` against www.design-bakery.com, 3 of 3 lines heard and answered.

**Next.** The live site's calls are still answered by the lab's voice worker (`VOICE_LIVEKIT_*` unset on the VPS), not this repo's `voice-agent/`. Then retrieval from Octo on call turns (PR #205).
