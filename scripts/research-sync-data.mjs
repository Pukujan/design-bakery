#!/usr/bin/env node
/**
 * research:sync-data — copy Eval Lab's published chart data into the site.
 *
 * The site never runs Eval Lab. It consumes committed JSON from
 * `Pukujan/Eval-lab@paper/data/`, exactly like
 * `public/research/figures/benchmark/` consumes generated figures. Every byte
 * is checked against the sha256 in `paper/data/index.json` before it is
 * written, so a drifting upstream fails loudly here instead of silently
 * changing a published number. That hash — not the git ref — is the pin:
 * upstream's `index.json` records the exporter's HEAD at generation time,
 * which is not the commit that carries the exported files, so payloads are
 * read from the requested ref and verified byte-for-byte against the index.
 *
 * Usage:
 *   node scripts/research-sync-data.mjs            # fetch + verify + write
 *   node scripts/research-sync-data.mjs --check    # verify what is on disk (no network)
 *   node scripts/research-sync-data.mjs --ref <git-ref>   # read from another ref/commit
 *
 * Layout: upstream paths are mirrored under `frontend/public/research/data/`,
 * with the `paper/data/` prefix stripped (`paper/data/charts/x.json` →
 * `/research/data/charts/x.json`). Schema files are vendored into the chart
 * module as source, because the type generator and the chart-fence validator
 * both read them at build time.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = path.join(ROOT, 'frontend');
const DATA_DIR = path.join(FRONTEND, 'public', 'research', 'data');
const SCHEMA_DIR = path.join(FRONTEND, 'src', 'app', 'modules', 'research', 'chart', 'schema');

const REPOSITORY = 'Pukujan/Eval-lab';
const INDEX_PATH = 'paper/data/index.json';
const DATA_PREFIX = 'paper/data/';
const SCHEMA_PREFIX = 'schemas/';

/** Files we consume: the datasets/charts the site can render, plus the schema. */
const SYNCED_KINDS = new Set(['dataset', 'chart', 'schema']);

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const refIndex = args.indexOf('--ref');
const ref = refIndex === -1 ? process.env.RESEARCH_DATA_REF || 'main' : args[refIndex + 1];

function rawUrl(gitRef, repoPath) {
  return `https://raw.githubusercontent.com/${REPOSITORY}/${gitRef}/${repoPath}`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'design-bakery research:sync-data' },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} → HTTP ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Where a synced file lands locally, or null when we do not consume that kind. */
function localPathFor(file) {
  if (file.kind === 'schema') {
    if (!file.path.startsWith(SCHEMA_PREFIX)) return null;
    return path.join(SCHEMA_DIR, path.basename(file.path));
  }
  if (!file.path.startsWith(DATA_PREFIX)) return null;
  return path.join(DATA_DIR, file.path.slice(DATA_PREFIX.length));
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

async function loadIndex() {
  if (checkOnly) {
    try {
      return { index: JSON.parse(await readFile(path.join(DATA_DIR, 'index.json'), 'utf8')) };
    } catch (error) {
      throw new Error(
        `cannot read ${relative(path.join(DATA_DIR, 'index.json'))} (${error.code ?? error.message}); run \`pnpm research:sync-data\` first`,
      );
    }
  }
  const buffer = await fetchBuffer(rawUrl(ref, INDEX_PATH));
  return { buffer, index: JSON.parse(buffer.toString('utf8')) };
}

async function main() {
  const loaded = await loadIndex();
  const { index } = loaded;
  if (index.schemaVersion !== '1.0') {
    throw new Error(
      `Unsupported chart-data schemaVersion ${JSON.stringify(index.schemaVersion)}; expected "1.0".`,
    );
  }

  const pinnedCommit = index.commit;
  if (!/^[0-9a-f]{40}$/.test(pinnedCommit ?? '')) {
    throw new Error(`index.json has no usable commit (${JSON.stringify(pinnedCommit)}).`);
  }

  const wanted = index.files.filter((file) => SYNCED_KINDS.has(file.kind));
  if (wanted.length === 0) throw new Error('index.json lists no dataset/chart/schema files.');

  const problems = [];
  const written = [];

  // The index itself ships with the data: the browser loader resolves a
  // dataset id to its file through it, and `--check` verifies against it.
  if (!checkOnly) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(path.join(DATA_DIR, 'index.json'), loaded.buffer);
  }
  const indexLocal = path.join(DATA_DIR, 'index.json');

  for (const file of wanted) {
    if (path.resolve(localPathFor(file) ?? '') === path.resolve(indexLocal)) {
      throw new Error(`${file.path} would overwrite the index; upstream layout changed.`);
    }
    const destination = localPathFor(file);
    if (!destination) {
      problems.push(`${file.path}: no local mapping for kind "${file.kind}"`);
      continue;
    }

    let buffer;
    if (checkOnly) {
      try {
        buffer = await readFile(destination);
      } catch {
        problems.push(`${file.path}: missing locally at ${relative(destination)}`);
        continue;
      }
    } else {
      buffer = await fetchBuffer(rawUrl(ref, file.path));
    }

    const actualBytes = buffer.byteLength;
    const actualSha = sha256(buffer);
    const fileProblems = [];
    if (actualBytes !== file.bytes) {
      fileProblems.push(`${actualBytes} bytes, index.json says ${file.bytes}`);
    }
    if (actualSha !== file.sha256) {
      fileProblems.push(`sha256 ${actualSha}, index.json says ${file.sha256}`);
    }
    if (fileProblems.length > 0) {
      problems.push(`${file.path}: ${fileProblems.join('; ')}`);
      continue;
    }

    if (!checkOnly) {
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, buffer);
    }
    written.push(file);
  }

  if (problems.length > 0) {
    console.error(`research:sync-data — ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exitCode = 1;
    return;
  }

  const mode = checkOnly ? 'verified' : 'synced';
  console.log(
    `research:sync-data — ${mode} ${written.length} file(s) at ${REPOSITORY}@${pinnedCommit.slice(0, 12)}`,
  );
  for (const file of written) console.log(`  ✓ ${file.path} → ${relative(localPathFor(file))}`);
  if (!checkOnly) {
    console.log('  next: pnpm research:gen-types (if the schema changed) and pnpm build');
  }
}

main().catch((error) => {
  console.error(`research:sync-data — ${error.message}`);
  process.exitCode = 1;
});
