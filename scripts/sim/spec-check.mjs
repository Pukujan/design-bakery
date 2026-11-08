/**
 * The spec's metamorphic checks (additionals/doc/copilot-spec.md §8 and §9) against the real backend: fixed relation cases
 * from scripts/sim/pools/relations.json, and generated cases (a base flow with seeded detours or speech noise) compared with
 * the same flow run plainly. Every run is also checked against the invariants.
 *
 *   node scripts/sim/spec-check.mjs [--set smoke|full] [--seed 1] [--count N] [--runs 1] [--only MR-2]
 *        [--shrink] [--save] [--lane hybrid] [--base http://localhost:8787] [--verbose] [--out report.json]
 *
 * --shrink reruns a failing generated case with fewer operations to find the smallest that still fails. --save keeps each
 * failing generated case in the lane's copilot_<lane>_replay_cases table (Octo). The backend runs with COPILOT_DEBUG_EVENTS=1.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createClient, runConversation } from './lib/client.mjs';
import { loadEnv } from './lib/env.mjs';
import { apply, changedFrom, generate, shrink } from './lib/generate.mjs';
import { checkConversation } from './lib/invariants.mjs';
import { compareRepeat, compareReordered, compareRuns, diffTurns } from './lib/relations.mjs';
import { saveReplayCase } from './lib/replay.mjs';
import { INVARIANT_IDS, Tally, printRun } from './lib/report.mjs';
import { same } from './lib/spec.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const pools = new URL('./pools/', import.meta.url);
const load = async (name) => JSON.parse(await readFile(new URL(name, pools), 'utf8'));
const { flows } = await load('flows.json');
const { detours } = await load('detours.json');
const noise = await load('noise.json');
const relations = await load('relations.json');

const setName = flag('--set', 'smoke');
const set = relations.sets[setName];
if (!set) { console.error(`no set "${setName}" in pools/relations.json`); process.exit(2); }
const only = flag('--only');
const runs = Number(flag('--runs', 1));
const seed0 = Number(flag('--seed', 1));
const count = Number(flag('--count', set.generated));
const lane = flag('--lane');
const verbose = args.includes('--verbose');
const env = await loadEnv();
const client = createClient(flag('--base', 'http://localhost:8787'));
const tally = new Tally();
const report = [];

const fixed = relations.cases.filter((c) => (set.fixed === 'all' || set.fixed.includes(c.id)) && (!only || c.relation === only));
const generatedRelations = ['MR-2', 'MR-3'];
const generatedCount = !only || generatedRelations.includes(only) ? count : 0;

const one = (startPage, lines) => ({ startPage, steps: lines.map((say) => ({ say })) });
const asFails = (id, diffs) => diffs.map((msg) => ({ id, turn: null, msg }));
const flowById = (id) => flows.find((f) => f.id === id);

/** A base flow runs once per run index and is shared by every case built on it. */
const bases = new Map();
async function baseRun(flow, run, laneName = lane) {
  const key = `${flow.id}|${run}|${laneName ?? ''}`;
  if (!bases.has(key)) {
    const turns = await runConversation(client, flow, { lane: laneName });
    const fails = checkConversation(turns);
    bases.set(key, turns);
    tally.run(INVARIANT_IDS, fails);
    printRun(`base ${flow.id} · run ${run}${laneName ? ` · ${laneName}` : ''}`, turns, fails, { verbose });
  }
  return bases.get(key);
}

function record(title, id, turns, fails) {
  tally.run([id, ...INVARIANT_IDS], fails);
  printRun(title, turns, fails, { verbose });
  report.push({ title, id, fails, turns });
}

for (let run = 1; run <= runs; run += 1) {
  for (const c of fixed) {
    if (c.relation === 'MR-1') {
      const base = await runConversation(client, one(c.startPage, [c.base]), { lane });
      for (const say of c.variants) {
        const v = await runConversation(client, one(c.startPage, [say]), { lane });
        const diffs = diffTurns(base[0], v[0]).map((d) => `"${c.base}" vs "${say}": ${d}`);
        record(`${c.id} (MR-1) "${say}" · run ${run}`, 'MR-1', v, [...asFails('MR-1', diffs), ...checkConversation(v)]);
      }
    } else if (c.relation === 'MR-5') {
      const a = await runConversation(client, one(c.startPage, c.lines), { lane });
      const b = await runConversation(client, one(c.startPage, [...c.lines].reverse()), { lane });
      record(`${c.id} (MR-5) · run ${run}`, 'MR-5', b, [...asFails('MR-5', compareReordered(a, b)), ...checkConversation(a), ...checkConversation(b)]);
    } else if (c.relation === 'MR-6') {
      const t = await runConversation(client, one(c.startPage, c.lines), { lane });
      record(`${c.id} (MR-6) · run ${run}`, 'MR-6', t, [...asFails('MR-6', compareRepeat(t, c.first, c.second, c.mode)), ...checkConversation(t)]);
    } else if (c.relation === 'MR-7') {
      const flow = flowById(c.flow);
      const [x, y] = c.lanes;
      const a = await baseRun(flow, run, x);
      const b = await runConversation(client, flow, { lane: y });
      // A tool the other lane does not offer cannot be expected of it.
      const offeredB = new Set(b.flatMap((t) => t.offered ?? []));
      const ignore = [...new Set(a.flatMap((t) => t.offered ?? []))].filter((tool) => !offeredB.has(tool));
      const lanesSeen = [a[0]?.lane, b[0]?.lane];
      const wrongLane = lanesSeen[0] === x && lanesSeen[1] === y ? [] : [`asked for lanes ${x} and ${y}, ran on ${lanesSeen} (is COPILOT_DEBUG_EVENTS=1 set?)`];
      record(`${c.id} (MR-7 ${x} vs ${y}) · run ${run}`, 'MR-7', b, [...asFails('MR-7', [...wrongLane, ...compareRuns(a, b, { pages: flow.keepsPage, ignore })]), ...checkConversation(b)]);
    } else if (c.relation === 'MR-8') {
      const here = await runConversation(client, one(c.page, [c.here]), { lane });
      const named = await runConversation(client, one(c.from, [c.named]), { lane });
      const cites = (t) => [...new Set(t[0].actions.filter((a) => a.kind === 'cite').map((a) => a.path))].sort();
      const diffs = [];
      for (const [label, t] of [['here', here], ['named', named]]) if (!t[0].steps.includes('summarize_page')) diffs.push(`"${t[0].say}" (${label}) did not call summarize_page: [${t[0].steps}]`);
      if (!same(cites(here), cites(named))) diffs.push(`pointed at [${cites(here)}] vs [${cites(named)}]`);
      if (cites(here).some((p) => p !== c.page.path)) diffs.push(`"${c.here}" pointed outside ${c.page.path}: [${cites(here)}]`);
      record(`${c.id} (MR-8) · run ${run}`, 'MR-8', named, [...asFails('MR-8', diffs), ...checkConversation(here), ...checkConversation(named)]);
    }
  }

  for (let k = 0; k < generatedCount; k += 1) {
    const seed = seed0 + k;
    const g = generate(seed, { flows, detours, noise }, only ? { relation: only } : {});
    const flow = flowById(g.flow);
    const base = await baseRun(flow, run);
    const compare = async (ops) => {
      const { conversation, map } = apply(flow, ops);
      const turns = await runConversation(client, conversation, { lane });
      return { conversation, turns, diffs: compareRuns(base, turns, { map, turns: changedFrom(ops, base.length), pages: flow.keepsPage }) };
    };
    const first = await compare(g.ops);
    let kept = { ops: g.ops, ...first };
    if (first.diffs.length && args.includes('--shrink') && g.ops.length > 1) {
      const small = await shrink(g.ops, async (ops) => (await compare(ops)).diffs.length > 0);
      if (small.ops.length < g.ops.length) kept = { ops: small.ops, ...(await compare(small.ops)) };
      console.log(`   shrunk seed ${seed} from ${g.ops.length} to ${kept.ops.length} operation(s) in ${small.runs} run(s)`);
    }
    const fails = [...asFails(g.relation, kept.diffs), ...checkConversation(kept.turns)];
    record(`seed ${seed}: ${g.flow} (${g.relation}) ${JSON.stringify(kept.ops)} · run ${run}`, g.relation, kept.turns, fails);
    if (fails.length && args.includes('--save')) {
      const laneName = kept.turns.find((t) => t.lane)?.lane ?? lane ?? 'hybrid';
      try {
        const id = await saveReplayCase(env, laneName, {
          name: `gen-${g.flow}-${g.relation}-s${seed}`,
          lines: kept.conversation,
          checks: { spec: 'additionals/doc/copilot-spec.md', relation: g.relation, base: g.flow, ops: kept.ops, failed: [...new Set(fails.map((f) => f.id))], diffs: kept.diffs },
        });
        console.log(`   kept as replay case ${id} in copilot_${laneName}_replay_cases`);
      } catch (error) {
        console.warn(`   not kept: ${error instanceof Error ? error.message : error}`);
      }
    }
  }
}

tally.print();
const out = flag('--out');
if (out) await writeFile(out, JSON.stringify({ at: new Date().toISOString(), set: setName, seed: seed0, rates: tally.rows(), runs: report }, null, 2));
process.exit(tally.failedRuns ? 1 : 0);
