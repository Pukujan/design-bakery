/**
 * The copilot's streaming text filter (backend/src/copilot/textFilter.ts).
 *
 * The cases come from real turns in Phoenix, not invented ones: the "give me a tour"
 * answer that leaked ~1,400 characters of reasoning followed by `</think>` and a repeat
 * of its own last paragraph, and the "let me pull up the blog page for you" line before
 * a tool call.
 *
 * Runs against the compiled backend (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);

let createTextFilter;
try {
  ({ createTextFilter } = await import(new URL('./backend/lib/copilot/textFilter.js', root).href));
} catch {
  throw new Error('copilot stream filter: build the backend first (pnpm --dir backend run build)');
}

/** Collects what a visitor would see, applying `replace` the way the store does. */
function harness() {
  const events = [];
  let text = '';
  const send = (chunk, replace) => {
    events.push({ chunk, replace: Boolean(replace) });
    text = replace ? chunk : text + chunk;
  };
  return { events, send, get text() { return text; } };
}

const CHUNK = 12;
const feed = (filter, text) => {
  for (let i = 0; i < text.length; i += CHUNK) filter.push(text.slice(i, i + CHUNK));
};

// 1. A leaked reasoning block, exactly as the tour turn arrived: thinking, `</think>`,
//    then the real answer (which repeats the last paragraph of the thinking).
const thinking = `Sure, let me walk you through it.

This is the short version: Pujan builds AI agents that improve through data, testing, and human feedback.

Here's the work history. The most recent roles are at The Fitzgerald Law Firm.

That's the lay of the land. Want me to dig into any of these?`;
const answer = 'That is the lay of the land. Want me to dig into a project, a paper, or an area of his work?';
{
  const seen = harness();
  const filter = createTextFilter(seen.send);
  feed(filter, `${thinking}</think>\n\n${answer}`);
  const final = filter.flush();
  assert.equal(final, answer, 'the reasoning before </think> must not reach the visitor');
  assert.equal(seen.text, answer, 'the client must end up showing the answer only');
}

// 2. The same leak when it closes late, after the hold has already released text: the
//    client has to be told to replace what it showed.
{
  const seen = harness();
  const filter = createTextFilter(seen.send, 50);
  feed(filter, thinking);
  const leaked = seen.text;
  assert.ok(leaked.length > 0, 'long text streams before the closing tag arrives');
  feed(filter, `</think>\n\n${answer}`);
  const final = filter.flush();
  assert.equal(final, answer);
  assert.equal(seen.text, answer, 'the replace event must leave the answer alone on screen');
  assert.ok(seen.events.some((event) => event.replace), 'a late think block must send a replace');
}

// 3. A short, clean answer is held and then shown once, with no replace churn.
{
  const seen = harness();
  const filter = createTextFilter(seen.send);
  feed(filter, answer);
  assert.equal(seen.text, '', 'a short answer is held until the turn ends');
  assert.equal(filter.flush(), answer);
  assert.equal(seen.text, answer);
  assert.ok(seen.events.every((event) => !event.replace), 'nothing to retract in a clean answer');
}

// 4. Narration before a tool call is dropped, and the answer that follows still lands.
{
  const seen = harness();
  const filter = createTextFilter(seen.send);
  feed(filter, 'Let me pull up the blog page for you.');
  filter.toolCall();
  filter.toolResult();
  feed(filter, 'The blog is on screen. A few that tend to interest people: the legal AI series.');
  const final = filter.flush();
  assert.equal(final, 'The blog is on screen. A few that tend to interest people: the legal AI series.');
  assert.equal(seen.text, final);
}

// 5. An opening tag with no close yet shows nothing at all.
{
  const seen = harness();
  const filter = createTextFilter(seen.send, 50);
  feed(filter, '<think>weighing whether this needs a tool call, and which one');
  assert.equal(seen.text, '', 'text inside an unclosed think block is not answer text');
  feed(filter, '</think>Yes, the Cortex project covers OCR.');
  assert.equal(filter.flush(), 'Yes, the Cortex project covers OCR.');
}

// 6. Text after a tool call starts a new paragraph rather than running into the sentence
//    that preceded the call.
{
  const seen = harness();
  const filter = createTextFilter(seen.send, 10);
  feed(filter, 'Two things stand out.');
  filter.toolCall();
  filter.toolResult();
  feed(filter, 'The first is the eval harness.');
  assert.equal(filter.flush(), 'Two things stand out.\n\nThe first is the eval harness.');
}

// 7. On a call, background talk is answered with [quiet]: nothing is shown or said, and the route can tell.
{
  const seen = harness();
  const filter = createTextFilter(seen.send);
  feed(filter, '[quiet]');
  assert.equal(filter.flush(), '');
  assert.equal(filter.quiet(), true);
  assert.equal(seen.text, '');
  const spoken = harness();
  const normal = createTextFilter(spoken.send);
  feed(normal, 'Poor Chad. Rats are braver than they look.');
  assert.equal(normal.flush(), 'Poor Chad. Rats are braver than they look.');
  assert.equal(normal.quiet(), false);
}

console.log('copilot stream filter: 7 cases (leaked reasoning, late close, hold, narration, open block, paragraph break, quiet)');
