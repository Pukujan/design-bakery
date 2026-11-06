/**
 * A call simulator: plays scripted conversations through the copilot's real backend in voice mode (the same /api/copilot/chat
 * the voice agent calls, with the real model chain, tools and site data) and checks every turn against the spec
 * (additionals/doc/copilot-spec.md): the invariants on every turn, each step's own expectations, and the judge for wording.
 *
 *   node scripts/sim/call-sim.mjs scripts/sim/scenarios/booking.json [more.json ...] [--all]
 *        [--base http://localhost:8787] [--runs 3] [--lane hybrid] [--no-judge] [--verbose] [--out report.json]
 *
 * The base is a local backend started with COPILOT_DEBUG_EVENTS=1 (the `api-voice` launch config: no Turnstile, traces off),
 * which sends what each turn offered and what its tools returned. Models vary run to run, so every id is scored as a pass rate
 * over --runs. Exit code 1 when any check fails in any run.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createClient, runConversation } from './lib/client.mjs';
import { loadEnv } from './lib/env.mjs';
import { checkRubric, checkStep, judgeAsks, validateScenario } from './lib/expect.mjs';
import { checkConversation } from './lib/invariants.mjs';
import { briefLoader, createJudge, defaultAsks, loadRubric, pool } from './lib/judge.mjs';
import { INVARIANT_IDS, Tally, printRun } from './lib/report.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const scenarioDir = new URL('./scenarios/', import.meta.url);
const files = args.includes('--all')
  ? (await readdir(scenarioDir)).filter((f) => f.endsWith('.json')).sort().map((f) => new URL(f, scenarioDir))
  : args.filter((a) => a.endsWith('.json') && a !== flag('--out')).map((f) => new URL(f, `file://${process.cwd()}/`));
if (!files.length) { console.error('usage: node scripts/sim/call-sim.mjs <scenario.json ...> | --all [--base URL] [--runs N] [--lane L] [--no-judge] [--verbose] [--out file]'); process.exit(2); }
const runs = Number(flag('--runs', 1));
const lane = flag('--lane');
const verbose = args.includes('--verbose');
const out = flag('--out');

const env = await loadEnv();
const rubric = await loadRubric();
const judge = args.includes('--no-judge') ? null : createJudge({ env, rubric, brief: briefLoader(env) });
const client = createClient(flag('--base', 'http://localhost:8787'));
const tally = new Tally();
const report = [];
let warned = false;

for (const file of files) {
  const scenario = JSON.parse(await readFile(file, 'utf8'));
  validateScenario(scenario, file.pathname.split('/').at(-1));
  for (let run = 1; run <= runs; run += 1) {
    const turns = await runConversation(client, scenario, { lane });
    if (!warned && !turns.some((t) => t.offered)) {
      warned = true;
      console.warn('[sim] the backend sent no debug events: start it with COPILOT_DEBUG_EVENTS=1, or INV-1, INV-5, INV-6, EX-1 and the judge\'s view of the tools are not checked');
    }
    const fails = [
      ...checkConversation(turns, { maxQuestionTurns: scenario.rubric?.maxQuestionTurns }),
      ...turns.flatMap((t, i) => checkStep(scenario.steps[i], t)),
      ...checkRubric(scenario.rubric, turns),
    ];
    const asked = turns.map((t, i) => ({ ...defaultAsks(t), ...judgeAsks(scenario.steps[i]) }));
    const before = judge?.verdicts.length ?? 0;
    if (judge) fails.push(...(await pool(turns.map((t, i) => () => judge.judge(t, asked[i])))).flat());
    // A judge id counts as checked only when the judge gave a verdict on it; an unanswered one is reported with "?".
    const judged = judge ? judge.verdicts.slice(before).filter((v) => v.pass !== null).map((v) => v.id) : [];
    const fields = scenario.steps.some((s) => s.expect?.book || s.expect?.booking?.has);
    const checked = [...INVARIANT_IDS, 'STEP', ...(fields ? ['INV-4'] : []), ...judged];
    tally.run(checked, fails);
    printRun(`${scenario.name} · run ${run}/${runs}`, turns, fails, { verbose });
    report.push({ scenario: scenario.name, run, fails, turns });
  }
}
tally.print();
if (judge) console.log(`judge: rubric v${judge.version}, ${judge.tokens()} tokens`);
if (out) await writeFile(out, JSON.stringify({ at: new Date().toISOString(), rates: tally.rows(), runs: report }, null, 2));
process.exit(tally.failedRuns ? 1 : 0);
