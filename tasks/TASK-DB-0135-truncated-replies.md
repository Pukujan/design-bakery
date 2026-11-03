# TASK-DB-0135: copilot replies that end mid-sentence, and the slow model turns

**Goal.** Never send a cut-off reply; stop hidden thinking starving the visible text; cut the 15 to 33 s model turns.

**Evidence (Phoenix, `copilot.turn`, 2026-11-03 03:25 to 03:49 UTC, 23 model turns).** "how many paperes have you written" took
12.2 s and ended "...and a few others. Want me", status `done`. That turn was answered by **`qwen:yolo`, not DeepSeek**: 240
completion tokens (exactly the cap) for 139 visible characters, so about 200 tokens were hidden reasoning. DeepSeek turns
match their text (about 4 chars per token) and were 2 to 8 s; the slow ones were Qwen (9 to 17 s), WorkBuddy (15 s for 49
tokens) and one DeepSeek tool loop ("sure": three `cite` calls, 50k prompt tokens, 33 s).

**Root cause.** `withoutThinking` matched the thinking switch on the bare model name. Qwen's model is `yolo`, so `/qwen/` never
matched and thinking was never turned off for it. Nothing read the finish reason, so a `length` stop was sent as complete.

**Done.**
- `model-fallback.ts`: the switch is chosen from the step name (`qwen:yolo`); Qwen gets `enable_thinking` and
  `chat_template_kwargs.enable_thinking` false; OpenRouter gets `reasoning: {enabled: false}`.
- `truncation.ts`: `isCutOff` (finish reason `length`, or an unknown stop with no closing punctuation) and `trimToLastSentence`;
  `route.ts` sends the trimmed text with `replace: true`. Trace attributes `copilot.finish_reason`, `copilot.truncated`.
- Budget: `maxOutputTokens` 400 in chat, 300 on a call (was 240); the prompt's length rules are unchanged.
- Latency: on a call the quickest healthy provider goes first (`byHealth(…, fastest)`) and a model silent for 4 s gives way to
  the next (6 s in chat). `smallTalk.ts`: a short social reply that does not answer a site offer gets no tools and one step.
- Test: `pnpm test:copilot-truncation` (fake SSE stream ending on `length` through the AI SDK, trimming, switch per provider,
  small talk), added to CI.

**Not verified.** No provider keys exist on this Mac (`backend/.env` has only an OpenRouter key), so a real Qwen call was not
made: whether yolo-auto honours `chat_template_kwargs` is confirmed only by the next traces (`llm.token_count.completion` close to
visible length). On a call, text already spoken before a trim cannot be retracted; the larger budget is what protects voice.

**Next.** After deploy, read `copilot.truncated` and Qwen completion tokens vs characters in Phoenix. Rebase after #193 (route.ts, tracing.ts).
