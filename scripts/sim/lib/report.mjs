/** Printing runs and scoring each spec id as a pass rate over runs (copilot-spec.md §8: a rate per id, not one run). */

const short = (text, n = 170) => String(text ?? '').split('\n').join(' ').slice(0, n);

/** Prints one run's turns, with each failure under the turn it belongs to. */
export function printRun(title, turns, fails, { verbose = false } = {}) {
  const bad = fails.filter((f) => f.id !== 'JUDGE');
  console.log(`\n== ${title}: ${bad.length ? `${bad.length} failure(s)` : 'ok'}`);
  for (const f of fails.filter((x) => x.turn === null)) console.log(`   ${f.id === 'JUDGE' ? '?' : '✗'} ${f.id}: ${f.msg}`);
  for (const t of turns) {
    const mine = fails.filter((f) => f.turn === t.i);
    const failed = mine.some((f) => f.id !== 'JUDGE');
    console.log(`${failed ? '✗' : '✓'} ${t.i}. "${t.say}"  [${t.ms} ms, ${t.pageAfter?.path}, ${String(t.model).split('/')[0]}${t.steps.length ? `, ${t.steps.join(' ')}` : ''}]`);
    if (verbose || failed) {
      console.log(`     said:    ${short(t.text) || '-'}`);
      console.log(`     actions: ${t.actions.map((a) => a.kind + (a.path ? `(${a.path})` : '')).join(', ') || '-'}`);
    }
    for (const f of mine) console.log(`     ${f.id === 'JUDGE' ? '?' : '✗'} ${f.id}: ${f.msg}`);
  }
}

/** Counts, for every id, how many runs it was checked in and how many of those it failed. */
export class Tally {
  constructor() { this.ids = new Map(); this.runs = 0; this.failedRuns = 0; this.unchecked = 0; }
  /** `checked` lists the ids that ran in this run; `fails` are its failures. */
  run(checked, fails) {
    this.runs += 1;
    const failed = new Set(fails.filter((f) => f.id !== 'JUDGE').map((f) => f.id));
    this.unchecked += fails.filter((f) => f.id === 'JUDGE').length;
    if (failed.size) this.failedRuns += 1;
    for (const id of new Set([...checked, ...failed])) {
      const row = this.ids.get(id) ?? { runs: 0, failed: 0 };
      row.runs += 1;
      if (failed.has(id)) row.failed += 1;
      this.ids.set(id, row);
    }
  }
  rows() {
    const order = (id) => [id.split('-')[0], Number(id.split('-')[1] ?? 0)];
    return [...this.ids.entries()]
      .sort(([a], [b]) => { const [x, i] = order(a); const [y, j] = order(b); return x === y ? i - j : x < y ? -1 : 1; })
      .map(([id, r]) => ({ id, ...r, rate: r.runs ? (r.runs - r.failed) / r.runs : 1 }));
  }
  print() {
    console.log('\n== pass rate per id (runs passed / runs checked)');
    for (const r of this.rows()) console.log(`   ${r.id.padEnd(7)} ${String(r.runs - r.failed).padStart(3)}/${String(r.runs).padEnd(3)} ${r.failed ? '✗' : '✓'}`);
    if (this.unchecked) console.log(`   ${this.unchecked} judge check(s) could not be made (see "?" lines)`);
    console.log(`\n${this.failedRuns ? `FAILED: ${this.failedRuns} of ${this.runs} run(s)` : `OK: ${this.runs} run(s)`}`);
  }
}

/** The ids a conversation was checked against, so a pass is counted as well as a failure. */
export const INVARIANT_IDS = ['INV-1', 'INV-2', 'INV-3', 'INV-5', 'INV-6', 'INV-7', 'INV-8', 'INV-9', 'EX-1'];
