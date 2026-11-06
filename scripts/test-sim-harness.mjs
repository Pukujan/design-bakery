/**
 * Offline tests for the spec harness (scripts/sim/lib): the invariants, step checks, judge parsing, relations and the
 * generator, on made-up turns. No backend or model is called. `pnpm test:sim-harness`.
 */
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { checkStep, judgeAsks, validateScenario } from './sim/lib/expect.mjs';
import { apply, changedFrom, generate, random, shrink } from './sim/lib/generate.mjs';
import { checkConversation, checkTurn, checkVisit } from './sim/lib/invariants.mjs';
import { defaultAsks, describeAction, judgeMessages, judgeRoute, parseVerdict } from './sim/lib/judge.mjs';
import { compareRepeat, compareReordered, compareRuns, diffTurns, trajectory } from './sim/lib/relations.mjs';
import { bookingStep, bookingToolsFor, countQuestions, endsWithQuestion, plain, says } from './sim/lib/spec.mjs';

let passed = 0;
const test = async (name, fn) => {
  try { await fn(); passed += 1; } catch (error) { console.error(`✗ ${name}`); throw error; }
};

const HOME = { path: '/', title: 'Home' };
const STEADY = ['navigate', 'step_list', 'tour_next', 'summarize_page', 'cite_section', 'search_site', 'show_projects', 'share_link'];
/** A made-up voice turn with no booking open, which passes every invariant; override what a test needs. */
const T = (o = {}) => ({
  i: 1, say: 'Hello.', toMe: false, voice: true, pageBefore: HOME, pageAfter: HOME, flowBefore: null, flowAfter: null,
  text: 'Hi, I am AI Pujan.', actions: [], steps: [], results: [], offered: [...STEADY, 'not_for_me', 'booking_start'],
  lane: 'hybrid', maxSteps: 5, truncated: false, tokens: 9000, ignored: false, errors: [], ms: 1200, model: 'deepseek:ali', ...o,
});
const ids = (fails) => fails.map((f) => f.id);
const flow = (data) => ({ kind: 'booking', data });

await test('plain text and saying a line', () => {
  assert.equal(plain('  I heard Poojan, spelled P, O, O, J, A, N. Is that right? '), 'i heard poojan spelled p o o j a n is that right');
  assert.ok(says('Sure! I heard Poojan, spelled P, O, O, J, A, N - is that right?', 'I heard Poojan, spelled P, O, O, J, A, N. Is that right?'));
  assert.ok(!says('I heard Pujan.', 'I heard Poojan.'));
  assert.ok(endsWithQuestion('Is that right?"'));
  assert.ok(!endsWithQuestion('Done. Tap it.'));
  assert.equal(countQuestions('One? Two?'), 2);
});

await test('the booking step and the tools O-2 allows', () => {
  assert.equal(bookingStep(null), null);
  assert.equal(bookingStep(flow({})), 'ask_name');
  assert.equal(bookingStep(flow({ name: 'Poojan' })), 'confirm_name');
  assert.equal(bookingStep(flow({ name: 'Poojan', nameOk: true, say: 'Poo-jun', email: 'a@b.co', emailOk: true })), 'ask_area');
  assert.deepEqual(bookingToolsFor(null), ['booking_start']);
  assert.deepEqual(bookingToolsFor(flow({ name: 'Poojan' })), ['booking_confirm_name', 'booking_repeat', 'booking_cancel']);
});

await test('a clean turn passes every invariant', () => {
  assert.deepEqual(checkTurn(T(), T()), []);
});

await test('INV-1: the offer may not shrink with state, and booking follows O-2', () => {
  const first = T();
  assert.deepEqual(ids(checkTurn(T({ offered: ['navigate', 'not_for_me', 'booking_start'] }), first)), ['INV-1']);
  const mid = flow({ name: 'Poojan' });
  const right = T({ flowBefore: mid, flowAfter: mid, offered: [...STEADY, 'not_for_me', 'booking_confirm_name', 'booking_repeat', 'booking_cancel'] });
  assert.deepEqual(checkTurn(right, first), []);
  const early = T({ flowBefore: mid, flowAfter: mid, offered: [...STEADY, 'not_for_me', 'booking_give_email', 'booking_repeat', 'booking_cancel'] });
  assert.deepEqual(ids(checkTurn(early, first)), ['INV-1']);
  assert.deepEqual(ids(checkTurn(T({ toMe: true }), first)), ['INV-1']);
  assert.deepEqual(ids(checkTurn(T({ offered: [...STEADY, 'not_for_me', 'booking_start', 'book_call'] }), first)), ['INV-1', 'INV-1']);
});

await test('INV-2: a thread moves only through its own tools', () => {
  assert.deepEqual(ids(checkTurn(T({ flowBefore: flow({}), flowAfter: flow({ name: 'X' }), steps: ['search_site'], offered: null }))), ['INV-2']);
  assert.deepEqual(ids(checkTurn(T({ pageAfter: { path: '/contact', title: 'Contact' } }))), ['INV-2']);
  assert.deepEqual(checkTurn(T({ pageAfter: { path: '/contact', title: 'Contact' }, steps: ['navigate'], actions: [{ kind: 'navigate', path: '/contact', go: true }] })), []);
});

await test('INV-3: only tools act, and the button only after every step is confirmed', () => {
  assert.deepEqual(ids(checkTurn(T({ actions: [{ kind: 'projects', slugs: ['x'] }] }))), ['INV-3']);
  const early = flow({ name: 'Poojan', nameOk: true });
  const book = { kind: 'book', name: 'Poojan', email: 'p@g.com', topic: 'Marketing' };
  assert.ok(ids(checkTurn(T({ flowBefore: early, steps: ['booking_give_area'], actions: [book], offered: null }))).includes('INV-3'));
  const dropped = T({ steps: ['share_link'], results: [{ name: 'share_link', ok: true }] });
  assert.deepEqual(ids(checkTurn(dropped)), ['INV-3']);
  assert.deepEqual(checkTurn({ ...dropped, actions: [{ kind: 'link', label: 'GitHub', url: 'https://github.com/x' }] }), []);
  assert.deepEqual(checkTurn(T({ steps: ['share_link'], results: [{ name: 'share_link', ok: false, error: 'only links from the brief' }] })), []);
  const ready = flow({ name: 'Poojan', nameOk: true, say: 'Poo-jun', email: 'p@g.com', emailOk: true });
  assert.deepEqual(checkTurn(T({ flowBefore: ready, steps: ['booking_give_area'], actions: [book], offered: null })), []);
});

await test('INV-5, INV-6, INV-7, INV-8 and INV-9 on one turn', () => {
  assert.deepEqual(ids(checkTurn(T({ steps: ['search_site', 'search_site', 'read_paper', 'read_paper', 'search_site', 'search_site'] }))), ['INV-5']);
  const summary = T({ steps: ['summarize_page'], results: [{ name: 'summarize_page', ok: true, passages: 3 }], actions: [{ kind: 'cite', path: '/' }] });
  assert.deepEqual(ids(checkTurn(summary)), ['INV-6']);
  assert.deepEqual(ids(checkTurn(T({ ignored: true, steps: ['not_for_me'] }))), ['INV-7']);
  assert.deepEqual(checkTurn(T({ ignored: true, steps: ['not_for_me'], text: '' })), []);
  assert.deepEqual(ids(checkTurn(T({ text: 'Want to see it? Or the other one?' }))), ['INV-8']);
  assert.deepEqual(ids(checkTurn(T({ truncated: true, text: 'I built a system that' }))), ['INV-9']);
});

await test('INV-8 per visit: at most 3 in 10 end in a question, booking steps aside', () => {
  const ask = (i) => T({ i, text: 'Anything else?' });
  const say = (i) => T({ i, text: 'Noted.' });
  assert.deepEqual(checkVisit([ask(1), ask(2), ask(3), say(4), say(5), say(6), say(7), say(8), say(9), say(10)]), []);
  assert.deepEqual(ids(checkVisit([ask(1), ask(2), ask(3), ask(4), say(5), say(6), say(7), say(8), say(9), say(10)])), ['INV-8']);
  const step = (i) => T({ i, text: 'Is that right?', steps: ['booking_give_name'] });
  assert.deepEqual(checkVisit([step(1), step(2), step(3), step(4), say(5)]), []);
});

await test('EX-1: a booking turn says the tool\'s line, punctuation aside', () => {
  const line = 'I heard Poojan, spelled P, O, O, J, A, N. Is that right?';
  const mid = flow({ name: 'Poojan' });
  const base = { flowBefore: flow({}), flowAfter: mid, steps: ['booking_give_name'], results: [{ name: 'booking_give_name', ok: true, say: line }], offered: null };
  assert.deepEqual(checkTurn(T({ ...base, text: 'I heard Poojan, spelled P O O J A N. Is that right?' })), []);
  assert.deepEqual(ids(checkTurn(T({ ...base, text: 'Got it, Poojan. Is that right?' }))), ['EX-1']);
});

await test('step checks: regex keys are refused, booking state and fields are read', () => {
  assert.throws(() => validateScenario({ name: 'x', steps: [{ say: 'a', expect: { textMatch: 'name' } }] }), /matches reply wording/);
  const t = T({ flowAfter: flow({ name: 'Pujan' }) });
  assert.deepEqual(checkStep({ expect: { booking: { step: 'confirm_name', has: { name: 'pujan' } } } }, t), []);
  assert.deepEqual(ids(checkStep({ expect: { booking: { step: 'ask_email', has: { name: 'Poojan' } } } }, t)), ['STEP', 'INV-4']);
  assert.deepEqual(ids(checkStep({ expect: { booking: { step: 'closed' } } }, T())), []);
  assert.deepEqual(judgeAsks({ expect: { judge: ['J-1'] } }), { 'J-1': '' });
  assert.deepEqual(judgeAsks({ expect: { judge: { 'J-4': 'names Precedent' } } }), { 'J-4': 'names Precedent' });
});

await test('every scenario file is free of wording checks', async () => {
  const dir = new URL('./sim/scenarios/', import.meta.url);
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json'))) validateScenario(JSON.parse(await readFile(new URL(f, dir), 'utf8')), f);
});

await test('the judge: default ids, the prompt, and reading its answer', () => {
  assert.deepEqual(defaultAsks(T()), { 'J-1': '' });
  assert.deepEqual(defaultAsks(T({ steps: ['summarize_page'] })), { 'J-1': '', 'J-2': '' });
  assert.deepEqual(defaultAsks(T({ ignored: true, text: '' })), {});
  const rubric = { rubric: { 'J-1': 'No claimed move without the move.', 'J-4': 'Answers the question.' } };
  const m = judgeMessages(rubric, T(), { 'J-1': '', 'J-4': 'names Precedent' });
  assert.ok(m[1].content.includes('No claimed move without the move.'));
  assert.ok(m[1].content.includes('For this turn: names Precedent'));
  assert.equal(describeAction({ kind: 'navigate', path: '/contact', go: true }), 'moved the page to /contact');
  assert.equal(describeAction({ kind: 'navigate', path: '/contact' }), 'showed a button to open /contact');
  assert.deepEqual(parseVerdict('Sure: {"J-1": {"pass": false, "why": "claims a move"}}', ['J-1', 'J-4']), {
    'J-1': { pass: false, why: 'claims a move' }, 'J-4': { pass: null, why: 'the judge gave no verdict' },
  });
  assert.equal(parseVerdict('no json here', ['J-1'])['J-1'].pass, null);
  const plainKey = judgeRoute({}, 'https://api.inferhub.dev/v1/', 'sk-1');
  assert.equal(plainKey.url, 'https://api.inferhub.dev/v1/chat/completions');
  const working = judgeRoute({ OCTO_BASE_URL: 'https://octo.example/api/' }, 'https://api.inferhub.dev/v1', 'octo_tmp_1');
  assert.equal(working.url, 'https://octo.example/api/vault/proxy');
  assert.equal(working.headers['x-octo-target'], 'https://api.inferhub.dev/v1/chat/completions');
});

await test('relations: trajectories ignore lookups and compare what was done', () => {
  const a = T({ steps: ['search_site', 'navigate'], actions: [{ kind: 'navigate', path: '/work/precedent', go: true }], pageAfter: { path: '/work/precedent' } });
  const b = T({ steps: ['navigate'], actions: [{ kind: 'navigate', path: '/work/precedent', go: true }], pageAfter: { path: '/work/precedent' } });
  assert.deepEqual(trajectory(a).acting, ['navigate']);
  assert.deepEqual(diffTurns(a, b), []);
  const c = T({ steps: [], actions: [] });
  assert.equal(diffTurns(a, c).length, 3);
});

await test('relations: a detour is skipped by the map, and the end must match', () => {
  const start = T({ i: 1, say: 'Book a call.', steps: ['booking_start'], flowAfter: flow({}), actions: [{ kind: 'navigate', path: '/contact', go: true }], pageAfter: { path: '/contact' } });
  const name = T({ i: 2, say: 'Poojan.', steps: ['booking_give_name'], flowBefore: flow({}), flowAfter: flow({ name: 'Poojan' }), pageBefore: { path: '/contact' }, pageAfter: { path: '/contact' } });
  const detour = T({ i: 2, say: 'Where are you based?', flowBefore: flow({}), flowAfter: flow({}), pageBefore: { path: '/contact' }, pageAfter: { path: '/contact' } });
  assert.deepEqual(compareRuns([start, name], [start, detour, { ...name, i: 3 }], { map: [0, 2] }), []);
  const lost = { ...name, i: 3, steps: ['booking_repeat'], flowAfter: flow({}) };
  assert.ok(compareRuns([start, name], [start, detour, lost], { map: [0, 2] }).length >= 2);
});

await test('relations: reordered lines and repeats', () => {
  const where = T({ say: 'Where are you based?' });
  const roles = T({ say: 'What roles?', steps: ['search_site'] });
  assert.deepEqual(compareReordered([where, roles], [roles, where]), []);
  const opened = flow({ name: 'Poojan', nameOk: true });
  const again = T({ say: 'Book a call.', steps: ['booking_repeat'], flowBefore: opened, flowAfter: opened });
  assert.deepEqual(compareRepeat([T({ say: 'Book a call.', steps: ['booking_start'] }), again], 0, 1, 'keeps'), []);
  const restarted = { ...again, steps: ['booking_start'], flowAfter: flow({}) };
  assert.equal(compareRepeat([T(), restarted], 0, 1, 'keeps').length, 2);
});

const pools = new URL('./sim/pools/', import.meta.url);
const load = async (n) => JSON.parse(await readFile(new URL(n, pools), 'utf8'));
const { flows } = await load('flows.json');
const { detours } = await load('detours.json');
const noise = await load('noise.json');
const relations = await load('relations.json');

await test('the generator: seeded, valid, and pages kept where they are compared', () => {
  const r1 = random(7);
  const r2 = random(7);
  assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
  assert.deepEqual(generate(42, { flows, detours, noise }), generate(42, { flows, detours, noise }));
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed += 1) {
    const g = generate(seed, { flows, detours, noise });
    seen.add(`${g.flow} ${g.relation}`);
    const f = flows.find((x) => x.id === g.flow);
    assert.ok(g.ops.length >= 1, `seed ${seed} has no operations`);
    for (const op of g.ops) {
      if (op.type === 'detour') {
        assert.ok(op.before >= 1 && op.before < f.steps.length);
        if (f.keepsPage) assert.ok(!detours.find((d) => d.say === op.say).moves, `seed ${seed} moves the page in ${f.id}`);
      } else {
        assert.ok(op.at >= 0 && op.at < f.steps.length);
        if (op.type !== 'filler') assert.equal(f.steps[op.at].role, 'request', `seed ${seed} changes a booking answer`);
      }
    }
  }
  assert.ok(seen.size >= 8, `only ${seen.size} flow and relation pairs in 200 seeds`);
});

await test('apply: detours go in, noise changes the line, the map points at the base lines', () => {
  const f = { startPage: HOME, steps: [{ say: 'Show me Precedent.', role: 'request' }, { say: 'Next.', role: 'request' }] };
  const { conversation, map } = apply(f, [{ type: 'detour', before: 1, say: 'Wait.' }, { type: 'mishear', at: 0, from: 'Precedent', to: 'President' }]);
  assert.deepEqual(conversation.steps.map((s) => s.say), ['Show me President.', 'Wait.', 'Next.']);
  assert.deepEqual(map, [0, 2]);
  assert.equal(apply(f, [{ type: 'filler', at: 1, text: 'Um,' }]).conversation.steps[1].say, 'Um, next.');
  assert.equal(apply(f, [{ type: 'restart', at: 0 }]).conversation.steps[0].say, 'Show me, show me Precedent.');
});

await test('only turns at or after the first change are compared', () => {
  assert.deepEqual(changedFrom([{ type: 'detour', before: 2, say: 'Wait.' }], 4), [2, 3]);
  assert.deepEqual(changedFrom([{ type: 'filler', at: 3, text: 'Um,' }, { type: 'detour', before: 1, say: 'Wait.' }], 4), [1, 2, 3]);
});

await test('shrink keeps the smallest set of operations that still fails', async () => {
  const ops = [{ id: 'a' }, { id: 'x' }, { id: 'b' }];
  const { ops: kept } = await shrink(ops, async (list) => list.some((o) => o.id === 'x'), 10);
  assert.deepEqual(kept, [{ id: 'x' }]);
});

await test('the fixed relation cases name real flows, lanes and sets', () => {
  const ids2 = new Set(relations.cases.map((c) => c.id));
  for (const s of Object.values(relations.sets)) if (Array.isArray(s.fixed)) for (const id of s.fixed) assert.ok(ids2.has(id), `set names unknown case ${id}`);
  for (const c of relations.cases) {
    if (c.flow) assert.ok(flows.some((f) => f.id === c.flow), `${c.id} names unknown flow ${c.flow}`);
    for (const l of c.lanes ?? []) assert.ok(['strong', 'hybrid', 'small'].includes(l));
  }
});

await test('checkConversation takes the first offer as the baseline', () => {
  const turns = [T({ i: 1 }), T({ i: 2, offered: ['navigate', 'not_for_me', 'booking_start'] })];
  assert.deepEqual(ids(checkConversation(turns)), ['INV-1']);
});

console.log(`sim harness: ${passed} tests passed`);
