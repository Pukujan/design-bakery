# TASK-DB-0147: Claude Haiku first, so AI Pujan answers faster

**Goal.** The owner demos the site today and asked for it to be fast, with Haiku through the Anthropic API as the Riley agent uses.

**Done.**
- `providers.ts`: a `haiku` row first in the table: `SMART_ANTHROPIC_KEY`, `claude-haiku-5-5` (`SMART_ANTHROPIC_MODEL`), Anthropic's OpenAI-compatible endpoint `https://api.anthropic.com/v1`. With no key, nothing changes.
- Lanes: `hybrid` (the default for chat and voice) and `strong` list `haiku` first; their body fixes send `thinking: { type: 'disabled' }` for it.
- `additionals/doc/env.md`: the copilot model keys, in order.

**Evidence.** Endpoint: first word ~0.45 s, a short answer ~1 s, tool calls work, `thinking` disabled accepted. Local stack, `call-sim` on `explore`, `chat-buttons`, `tools` (no judge): all passed on `haiku:claude-haiku-5-5`. "Summarize this paper" 3483 → 1575 ms, "Tell me about Precedent" 3681 → 2358 ms against DeepSeek in the same run. DeepSeek's run also failed INV-8 once; Haiku's did not.

**To go live.** Set `SMART_ANTHROPIC_KEY` in `~/apps/design-bakery/deploy/vps/.env.api` on the VPS and merge; Komodo redeploys. The key is the one Riley uses (`take2-riley/.env` `ANTHROPIC_API_KEY`), so its spend shows in Riley's Anthropic workspace.

**Next.** Voice: Deepgram (streaming STT) and Cartesia (TTS), as Riley has them, in place of the Pro's Parakeet and Pocket TTS.
