/**
 * Lanes (backend/src/copilot/lanes/): each loads on its own, its manifest is complete, its tool list names real tools, and its model
 * fixes are its own. Runs against the compiled backend (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';

const root = new URL('../backend/lib/copilot/', import.meta.url);
let loader, types, tools, schema;
try {
  loader = await import(new URL('lanes/loader.js', root).href);
  types = await import(new URL('lanes/types.js', root).href);
  schema = await import(new URL('lanes/schema.js', root).href);
  tools = await import(new URL('tools.js', root).href);
} catch {
  throw new Error('copilot lanes: build the backend first (pnpm --dir backend run build)');
}

// 1. Which lane a channel gets.
assert.equal(loader.laneNameFor('voice', {}), 'hybrid', 'default is the chain as it was');
assert.equal(loader.laneNameFor('voice', { COPILOT_LANE: 'small' }), 'small');
assert.equal(loader.laneNameFor('chat', { COPILOT_LANE: 'small', COPILOT_LANE_CHAT: 'strong' }), 'strong', 'a channel setting wins');
assert.equal(loader.laneNameFor('voice', { COPILOT_LANE: 'nope' }), 'hybrid', 'an unknown name falls back');

// 2. Every lane loads alone and is complete.
const real = Object.keys(tools.makeTools(() => undefined, { canNavigate: true, voice: true }));
const prefixes = new Set();
for (const name of types.LANE_NAMES) {
  const { manifest } = await loader.loadLane(name);
  assert.equal(manifest.name, name);
  assert.ok(manifest.providers.length, `${name}: providers`);
  for (const ch of ['voice', 'chat']) {
    assert.ok(manifest.limits.maxSteps[ch] >= 1 && manifest.limits.maxOutputTokens[ch] >= 100 && manifest.limits.startMs[ch] >= 1000, `${name}: ${ch} limits`);
  }
  if (manifest.tools !== 'all') for (const t of manifest.tools) assert.ok(real.includes(t), `${name}: tool ${t} does not exist`);
  assert.ok(!prefixes.has(manifest.tables.prefix), 'tables are not shared between lanes');
  prefixes.add(manifest.tables.prefix);
  assert.ok(schema.createSql(manifest).includes(`${manifest.tables.prefix}_flagged_turns`), `${name}: its own tables`);
}

// 3. Each lane's model fixes are its own.
const small = await loader.loadLane('small');
const strong = await loader.loadLane('strong');
const hybrid = await loader.loadLane('hybrid');
assert.deepEqual(small.adjustBody('dev:lfm3', { a: 1 }), { a: 1, chat_template_kwargs: { enable_thinking: false } });
assert.deepEqual(strong.adjustBody('deepseek:x', {}), { thinking: { type: 'disabled' } });
assert.deepEqual(strong.adjustBody('openrouter:x', { a: 1 }), { a: 1 }, 'strong does not carry the other lanes\' fixes');
assert.deepEqual(hybrid.adjustBody('openrouter:x', {}), { reasoning: { enabled: false } });
assert.ok(small.manifest.tools.length < real.length, 'the small lane has a shorter, closed tool list');
assert.ok(!small.manifest.tools.includes('suggest_followups'));

console.log('copilot lanes: strong, hybrid, small load alone, complete manifests, own fixes and tables');
