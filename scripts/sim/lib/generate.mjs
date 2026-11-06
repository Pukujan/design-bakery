/**
 * Generated conversations (copilot-spec.md §9): a base flow, changed by a seeded list of operations that should not matter
 * (an inserted detour for MR-2; fillers, a known mishearing or a false start for MR-3). The same seed gives the same case.
 * A failing case is shrunk by dropping operations while it still fails, so the case kept is the smallest that shows it.
 */

/** A small seeded random number generator (mulberry32): the same seed gives the same sequence on every machine. */
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];

/** Positions where a detour can go: after the flow has started, before one of its later lines. */
const gaps = (flow) => flow.steps.map((_, i) => i).filter((i) => i >= 1);

/** Makes one case from a seed: which flow, which relation, and its operations. */
export function generate(seed, { flows, detours, noise }, only = {}) {
  const rnd = random(seed);
  const choices = only.flow ? flows.filter((f) => f.id === only.flow) : flows;
  const flow = pick(rnd, choices);
  const relation = only.relation ?? (rnd() < 0.5 ? 'MR-2' : 'MR-3');
  const ops = [];
  if (relation === 'MR-2') {
    const allowed = detours.filter((d) => !flow.keepsPage || !d.moves);
    const count = 1 + Math.floor(rnd() * 2);
    const at = gaps(flow);
    for (let k = 0; k < count && at.length; k += 1) ops.push({ type: 'detour', before: pick(rnd, at), say: pick(rnd, allowed).say });
  } else {
    const count = 1 + Math.floor(rnd() * 2);
    const used = new Set();
    for (let k = 0; k < count; k += 1) {
      const at = Math.floor(rnd() * flow.steps.length);
      if (used.has(at)) continue;
      used.add(at);
      const line = flow.steps[at];
      const heard = noise.mishear.filter(([word]) => line.say.includes(word));
      const kinds = ['filler', ...(heard.length && line.role === 'request' ? ['mishear'] : []), ...(line.role === 'request' ? ['restart'] : [])];
      const kind = pick(rnd, kinds);
      if (kind === 'filler') ops.push({ type: 'filler', at, text: pick(rnd, noise.fillers) });
      else if (kind === 'mishear') { const [from, to] = pick(rnd, heard); ops.push({ type: 'mishear', at, from, to }); }
      else ops.push({ type: 'restart', at });
    }
  }
  return { seed, flow: flow.id, relation, ops };
}

/** A false start: the first word or two said, then the whole line ("Show me, show me Precedent."). */
function restart(say) {
  const words = say.split(' ').filter(Boolean);
  const start = words.slice(0, Math.min(2, Math.max(1, words.length - 1))).join(' ');
  const head = start.endsWith(',') || start.endsWith('.') ? start.slice(0, -1) : start;
  return `${head}, ${say.charAt(0).toLowerCase()}${say.slice(1)}`;
}

/** The variant conversation for a case, and `map`: the variant's index for each of the base flow's lines. */
export function apply(flow, ops) {
  const lines = flow.steps.map((s) => ({ ...s }));
  for (const op of ops) {
    const line = lines[op.at];
    if (!line) continue;
    if (op.type === 'filler') line.say = `${op.text} ${line.say.charAt(0).toLowerCase()}${line.say.slice(1)}`;
    if (op.type === 'mishear') line.say = line.say.split(op.from).join(op.to);
    if (op.type === 'restart') line.say = restart(line.say);
  }
  const steps = [];
  const map = [];
  const inserts = ops.filter((o) => o.type === 'detour');
  lines.forEach((line, i) => {
    for (const d of inserts.filter((o) => o.before === i)) steps.push({ say: d.say, detour: true });
    map[i] = steps.length;
    steps.push(line);
  });
  return { conversation: { startPage: flow.startPage, steps }, map };
}

/**
 * The base turns a set of changes can affect: from the first line changed or followed by an insertion, to the end. Turns
 * before it got the same lines in both runs, so a difference there is the model varying, not the relation failing.
 */
export function changedFrom(ops, length) {
  const first = Math.min(length, ...ops.map((op) => (op.type === 'detour' ? op.before : op.at)));
  return Array.from({ length: length - first }, (_, k) => first + k);
}

/** Drops operations one at a time while the case still fails; returns the smallest failing list found within `budget` runs. */
export async function shrink(ops, stillFails, budget = 6) {
  let kept = [...ops];
  let spent = 0;
  let changed = true;
  while (changed && kept.length > 1 && spent < budget) {
    changed = false;
    for (let i = 0; i < kept.length && spent < budget; i += 1) {
      const fewer = kept.filter((_, k) => k !== i);
      spent += 1;
      if (await stillFails(fewer)) { kept = fewer; changed = true; break; }
    }
  }
  return { ops: kept, runs: spent };
}
