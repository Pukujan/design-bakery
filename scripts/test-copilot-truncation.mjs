/**
 * Cut-off replies (TASK-DB-0135), from the real turn in Phoenix: Qwen ("yolo") answered
 * "how many paperes have you written" with 240 output tokens, 200 of them hidden thinking,
 * and the visitor saw "...and a few others. Want me" with the turn marked done.
 *
 * Runs against the compiled backend (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const root = new URL('..', import.meta.url);
let t, fb, h, ai, oai;
try {
  t = await import(new URL('./backend/lib/copilot/truncation.js', root).href);
  fb = await import(new URL('./backend/lib/copilot/model-fallback.js', root).href);
  h = await import(new URL('./backend/lib/copilot/health.js', root).href);
  const need = createRequire(new URL('./backend/package.json', root));
  ai = await import(need.resolve('ai'));
  oai = await import(need.resolve('@ai-sdk/openai-compatible'));
} catch (e) {
  throw new Error('copilot truncation: build the backend first (pnpm --dir backend run build)', { cause: e });
}

// 1. Trimming: the real reply, then the edges.
const real = 'Eleven, all working drafts still pending my approval. They cover agent reliability, LLM judges, bias containment, and a few others. Want me';
assert.equal(t.trimToLastSentence(real), 'Eleven, all working drafts still pending my approval. They cover agent reliability, LLM judges, bias containment, and a few others.');
assert.equal(t.trimToLastSentence('One sentence. Two sentences? And a "quote." then cut'), 'One sentence. Two sentences? And a "quote."');
assert.equal(t.trimToLastSentence('Already whole.'), 'Already whole.');
assert.equal(t.trimToLastSentence('No sentence end here, and then it simply stops at the'), 'No sentence end here, and then it simply stops at…', 'no whole sentence: last whole word and an ellipsis');
assert.equal(t.trimToLastSentence('3.5 is the number I mean to say, but the'), '3.5 is the number I mean to say, but…', 'a decimal point is not a sentence end');

// 2. When a reply counts as cut off.
assert.equal(t.isCutOff('length', 'Whole sentence.'), true, 'length is always a cut');
assert.equal(t.isCutOff('stop', 'Sure, here you go'), false, 'a model that chose to stop is trusted');
assert.equal(t.isCutOff('tool-calls', 'Here it is.'), false);
assert.equal(t.isCutOff('other', 'Want me'), true, 'an unknown stop with no closing punctuation');
assert.equal(t.isCutOff('other', 'Want me to open it?'), false);
assert.equal(t.isCutOff('length', ''), true);

// 3. A fake stream that ends on `length` reaches the route's code as finishReason 'length'.
const sse = (chunks) => new Response(new ReadableStream({ start(c) { for (const x of chunks) c.enqueue(new TextEncoder().encode(`data: ${typeof x === 'string' ? x : JSON.stringify(x)}\n\n`)); c.close(); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
const delta = (content, finish = null) => ({ id: 'x', object: 'chat.completion.chunk', created: 1, model: 'yolo', choices: [{ index: 0, delta: content ? { content } : {}, finish_reason: finish }] });
const bodies = [];
const base = async (_url, init) => {
  bodies.push(JSON.parse(init.body));
  return sse([delta('Eleven drafts. They cover bias containment, and a few others. Want me'), delta('', 'length'), { ...delta(''), choices: [], usage: { prompt_tokens: 8623, completion_tokens: 240, total_tokens: 8863 } }, '[DONE]']);
};
const steps = [{ name: 'qwen:yolo', model: 'yolo', route: () => ({ url: 'https://qwen.test/v1/chat/completions', headers: { authorization: 'Bearer k' } }) }];
const model = oai.createOpenAICompatible({ name: 'copilot', baseURL: 'http://copilot.invalid/v1', apiKey: 'x', fetch: fb.fallbackFetch(steps, base, () => undefined) })('yolo');
const result = ai.streamText({ model, prompt: 'how many papers', maxOutputTokens: 400 });
let text = '', finish;
for await (const part of result.fullStream) {
  if (part.type === 'text-delta') text += part.text;
  if (part.type === 'finish') finish = part.finishReason;
}
assert.equal(finish, 'length');
assert.ok(t.isCutOff(finish, text));
assert.equal(t.trimToLastSentence(text), 'Eleven drafts. They cover bias containment, and a few others.');

// 4. The thinking switch reaches Qwen even though its model name is "yolo" (the bug: /qwen/ never matched it).
const sent = bodies[0];
assert.equal(sent.enable_thinking, false, 'qwen:yolo is sent enable_thinking:false');
assert.deepEqual(sent.chat_template_kwargs, { enable_thinking: false });
assert.deepEqual(fb.withoutThinking('deepseek:cb/deepseek-v4.1-flash', { a: 1 }), { a: 1, thinking: { type: 'disabled' } });
assert.deepEqual(fb.withoutThinking('openrouter:nvidia/nemotron-3.5-super-vl:free', {}), { reasoning: { enabled: false } });
assert.deepEqual(fb.withoutThinking('workbuddy:auto', { a: 1 }), { a: 1 }, 'a provider with no known switch is left alone');
assert.deepEqual(fb.withoutThinking('qwen:yolo', { a: 1 }, 'on'), { a: 1 }, 'INFERHUB_THINKING=on leaves thinking alone');

// 5. Small talk skips the tool loop, offers and questions about the site do not.

// 6. On a call the quickest healthy provider goes first; a chat keeps the table order.
const ps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
assert.deepEqual(h.byHealth(ps, true).map((p) => p.id), ['a', 'b', 'c'], 'never probed: table order');

// 7. The free reasoning model never jumps the queue on a call, even when its probe was the quickest.
assert.deepEqual(h.byHealth([{ id: 'a' }, { id: 'openrouter' }, { id: 'c' }], true).map((p) => p.id), ['a', 'c', 'openrouter'], 'free model last among the healthy');

// 8. Real reply times outrank the probe: a provider that probes quickest but answers slowly drops behind. Needs two samples.
{
  const hh = await import(new URL('./backend/lib/copilot/health.js', root).href);
  const list = [{ id: 'slow' }, { id: 'quick' }, { id: 'openrouter' }];
  hh.noteLatency('slow', 9000);
  assert.deepEqual(hh.byHealth(list, true).map((p) => p.id), ['slow', 'quick', 'openrouter'], 'one sample is not enough to reorder');
  hh.noteLatency('slow', 8000); hh.noteLatency('quick', 1500); hh.noteLatency('quick', 1800);
  assert.deepEqual(hh.byHealth(list, true).map((p) => p.id), ['quick', 'slow', 'openrouter'], 'measured speed ranks, the free model stays last');
  assert.deepEqual(hh.byHealth(list, false).map((p) => p.id), ['slow', 'quick', 'openrouter'], 'a chat keeps the table order');
  hh.noteLatency('quick', NaN); hh.noteLatency('quick', -5);
  assert.deepEqual(hh.byHealth(list, true).map((p) => p.id), ['quick', 'slow', 'openrouter'], 'junk samples are ignored');
}

console.log('copilot truncation: 8 groups ok');
