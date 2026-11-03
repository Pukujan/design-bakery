/**
 * Navigation chips vs expansion chips (backend/src/copilot/chips.ts, mirrored in the frontend).
 * A navigation chip takes the visitor somewhere and the moon guides them there; an expansion chip is a follow-up that
 * stays in the chat. Also: the guest moon's entry and exit edges.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const back = await import(new URL('../backend/src/copilot/chips.ts', import.meta.url).href);
const front = await import(new URL('../frontend/src/app/modules/copilot/chips.ts', import.meta.url).href);
const { nearestEdge } = await import(new URL('../frontend/src/app/modules/copilot/citeRoute.ts', import.meta.url).href);

assert.equal(
  await readFile(new URL('../backend/src/copilot/chips.ts', import.meta.url), 'utf8'),
  await readFile(new URL('../frontend/src/app/modules/copilot/chips.ts', import.meta.url), 'utf8'),
  'the browser and the server share one rule',
);

for (const { chipKindOf, withChip } of [back, front]) {
  // Destinations.
  assert.equal(chipKindOf({ kind: 'navigate', path: '/work/x', label: 'x' }), 'navigate');
  assert.equal(chipKindOf({ kind: 'projects', slugs: ['a'] }), 'navigate');
  assert.equal(chipKindOf({ kind: 'cite', path: '/work/a', anchor: 'what-it-is', heading: 'What it is' }), 'navigate');
  assert.equal(chipKindOf({ kind: 'book', url: 'https://cal.com/x' }), 'navigate');
  assert.equal(chipKindOf({ kind: 'link', label: 'GitHub', url: 'https://github.com/x' }), 'navigate');
  // Follow-ups.
  assert.equal(chipKindOf({ kind: 'ask', text: 'What is it built with?' }), 'expand');
  // Not a chip at all.
  assert.equal(chipKindOf({ kind: 'scrollstep', path: '/', at: 1 }), null);
  // A kind nobody classified: a question stays in the chat, anything else is a place to go; an explicit chip wins.
  assert.equal(chipKindOf({ kind: 'mystery', text: 'Why is that?' }), 'expand');
  assert.equal(chipKindOf({ kind: 'mystery', text: 'Eval Lab' }), 'navigate');
  assert.equal(chipKindOf({ kind: 'mystery' }), 'navigate');
  assert.equal(chipKindOf({ kind: 'mystery', chip: 'expand' }), 'expand');
  // The kind of a known action cannot be overridden into the wrong behaviour.
  assert.equal(chipKindOf({ kind: 'navigate', path: '/', label: 'x', chip: 'expand' }), 'navigate');
  // The server stamps it.
  assert.equal(withChip({ kind: 'ask', text: 'More?' }).chip, 'expand');
  assert.equal(withChip({ kind: 'projects', slugs: [] }).chip, 'navigate');
  assert.equal('chip' in withChip({ kind: 'scrollstep', path: '/', at: 0 }), false);
}
assert.equal(front.openLabel('Eval Lab'), 'Open Eval Lab');

// Chip to behaviour, read from the chat's source: navigation chips call guide/cite (the moon), expansion chips send.
const chat = await readFile(new URL('../frontend/src/app/modules/copilot/CopilotChat.tsx', import.meta.url), 'utf8');
const branch = (kind) => chat.slice(chat.indexOf(`action.kind === '${kind}'`), chat.indexOf('</', chat.indexOf(`action.kind === '${kind}'`)));
assert.match(branch('ask'), /copilot\.send\(action\.text/);
assert.doesNotMatch(branch('ask'), /copilot\.(go|guide|cite)/);
assert.match(branch('navigate'), /copilot\.guide\(/);
assert.match(branch('projects'), /copilot\.guide\(/);
assert.match(branch('cite'), /copilot\.cite\(/);
assert.doesNotMatch(chat, /copilot\.go\(/, 'no chip jumps instantly');

// Where the guest moon comes in and goes out: the nearest edge, just off screen.
const view = { width: 1000, height: 700 };
assert.deepEqual(nearestEdge({ x: 80, y: 300 }, view, 46), { side: 'left', x: -70, y: 300 });
assert.deepEqual(nearestEdge({ x: 900, y: 300 }, view, 46), { side: 'right', x: 1070, y: 300 });
assert.deepEqual(nearestEdge({ x: 500, y: 30 }, view, 46), { side: 'top', x: 500, y: -70 });
assert.deepEqual(nearestEdge({ x: 500, y: 680 }, view, 46), { side: 'bottom', x: 500, y: 770 });

console.log('copilot chips: ok');
