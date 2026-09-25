/** Small unified-diff writer (line based, LCS) so the package needs no deps. */

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export function unifiedDiff(
  oldText: string,
  newText: string,
  options: { oldPath: string; newPath: string; context?: number },
): string {
  const context = options.context ?? 3;
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  if (oldText === newText) return '';

  const ops = diffOps(oldLines, newLines);
  const hunks = buildHunks(ops, context);
  if (hunks.length === 0) return '';

  const out: string[] = [];
  out.push(`--- a/${options.oldPath}`);
  out.push(`+++ b/${options.newPath}`);
  for (const hunk of hunks) {
    out.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
    out.push(...hunk.lines);
  }
  return `${out.join('\n')}\n`;
}

type Op = { kind: 'same' | 'del' | 'add'; line: string };

function diffOps(oldLines: string[], newLines: string[]): Op[] {
  const n = oldLines.length;
  const m = newLines.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i]![j] = oldLines[i] === newLines[j]
        ? (table[i + 1]![j + 1] ?? 0) + 1
        : Math.max(table[i + 1]![j] ?? 0, table[i]![j + 1] ?? 0);
    }
  }
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      ops.push({ kind: 'same', line: oldLines[i] ?? '' });
      i += 1;
      j += 1;
    } else if ((table[i + 1]![j] ?? 0) >= (table[i]![j + 1] ?? 0)) {
      ops.push({ kind: 'del', line: oldLines[i] ?? '' });
      i += 1;
    } else {
      ops.push({ kind: 'add', line: newLines[j] ?? '' });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ kind: 'del', line: oldLines[i] ?? '' });
    i += 1;
  }
  while (j < m) {
    ops.push({ kind: 'add', line: newLines[j] ?? '' });
    j += 1;
  }
  return ops;
}

function buildHunks(ops: Op[], context: number): Hunk[] {
  const hunks: Hunk[] = [];
  let index = 0;
  let oldLine = 1;
  let newLine = 1;

  while (index < ops.length) {
    if (ops[index]?.kind === 'same') {
      oldLine += 1;
      newLine += 1;
      index += 1;
      continue;
    }

    const start = Math.max(0, index - context);
    let end = index;
    let lastChange = index;
    while (end < ops.length) {
      if (ops[end]?.kind !== 'same') lastChange = end;
      if (end - lastChange > context) break;
      end += 1;
    }
    const slice = ops.slice(start, lastChange + 1);
    const oldCount = slice.filter((op) => op.kind !== 'add').length;
    const newCount = slice.filter((op) => op.kind !== 'del').length;
    const oldStart = oldLine - (index - start);
    const newStart = newLine - (index - start);

    hunks.push({
      oldStart,
      oldLines: oldCount,
      newStart,
      newLines: newCount,
      lines: slice.map((op) => `${op.kind === 'add' ? '+' : op.kind === 'del' ? '-' : ' '}${op.line}`),
    });

    for (let cursor = index; cursor <= lastChange; cursor += 1) {
      const op = ops[cursor];
      if (op?.kind !== 'add') oldLine += 1;
      if (op?.kind !== 'del') newLine += 1;
    }
    index = lastChange + 1;
  }

  return hunks;
}
