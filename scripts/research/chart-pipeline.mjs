/**
 * Shared plumbing for the two research-chart build steps.
 *
 * Node has to run the *same* React component the browser runs, so this bundles
 * `chart/static.tsx` with esbuild (already in the tree as Vite's transform) and
 * imports the result. That keeps one definition of how a chart looks: there is
 * no second, SVG-string-building implementation to drift.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FRONTEND = path.join(ROOT, 'frontend');
export const CONTENT_DIR = path.join(FRONTEND, 'src', 'app', 'modules', 'research', 'content');
export const DATA_DIR = path.join(FRONTEND, 'public', 'research', 'data');
export const CHART_DIR = path.join(FRONTEND, 'public', 'research', 'charts');
export const CHART_MODULE_DIR = path.join(FRONTEND, 'src', 'app', 'modules', 'research', 'chart');
export const STATIC_ENTRY = path.join(CHART_MODULE_DIR, 'static.tsx');

/** Widths written for every chart: desktop/print, then phone. */
export const CHART_WIDTHS = { wide: 720, narrow: 420 };

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function relativeToRoot(absolute) {
  return toPosix(path.relative(ROOT, absolute));
}

/* ------------------------------------------------------------------ fences */

/**
 * Find ```chart fences in markdown.
 *
 * Returns `{ paperId, file, line, body, index }`. Line numbers are 1-based and
 * point at the opening fence, so a build failure can name the exact line.
 */
export function findChartFences(markdown, file) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const fences = [];

  for (let index = 0; index < lines.length; index += 1) {
    const open = /^\s*```+\s*chart\s*$/.exec(lines[index]);
    if (!open) continue;

    const body = [];
    let cursor = index + 1;
    for (; cursor < lines.length; cursor += 1) {
      if (/^\s*```+\s*$/.test(lines[cursor])) break;
      body.push(lines[cursor]);
    }

    fences.push({
      file,
      line: index + 1,
      endLine: cursor + 1,
      body: body.join('\n'),
    });
    index = cursor;
  }

  return fences;
}

/** `db-r-2026-010.md` → `db-r-2026-010`. */
export function paperIdFor(file) {
  return path.basename(file).replace(/\.md$/, '');
}

export async function collectChartFences() {
  const files = [];
  for (const directory of [CONTENT_DIR, path.join(CONTENT_DIR, 'sources')]) {
    if (!existsSync(directory)) continue;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) files.push(path.join(directory, entry.name));
    }
  }
  files.sort();

  const fences = [];
  for (const file of files) {
    const markdown = await readFile(file, 'utf8');
    for (const fence of findChartFences(markdown, file)) {
      fences.push({ ...fence, paperId: paperIdFor(file) });
    }
  }
  return fences;
}

/* ---------------------------------------------------------------- datasets */

/** Same resolution the browser does: id → manifest entry → `paper/data/…`. */
export async function loadDatasetIndex() {
  const file = path.join(DATA_DIR, 'index.json');
  if (!existsSync(file)) {
    throw new Error(
      `${relativeToRoot(file)} is missing; run \`pnpm research:sync-data\` before building`,
    );
  }
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function datasetFileFor(index, id) {
  const entry = index.files?.find((file) => file.id === id && file.kind !== 'schema');
  const relative = entry
    ? entry.path.replace(/^paper\/data\//, '')
    : `${id}.json`;
  const absolute = path.join(DATA_DIR, relative);
  if (!existsSync(absolute)) {
    throw new Error(
      `dataset "${id}" is not published locally (expected ${relativeToRoot(absolute)}); run \`pnpm research:sync-data\``,
    );
  }
  return { absolute, relative, entry };
}

export async function readDataset(index, id) {
  const { absolute, entry } = await datasetFileFor(index, id);
  const buffer = await readFile(absolute);
  if (entry && sha256(buffer) !== entry.sha256) {
    throw new Error(
      `dataset "${id}" does not match the sha256 in index.json; re-run \`pnpm research:sync-data\``,
    );
  }
  return JSON.parse(buffer.toString('utf8'));
}

/* -------------------------------------------------------------- esbuild */

let rendererPromise = null;

/**
 * Bundle and import the static renderer once per process.
 *
 * Everything is bundled, React included, so the temp file can live anywhere and
 * Node never has to resolve a bare specifier from a directory that is not a
 * package root.
 */
export async function loadStaticRenderer() {
  if (rendererPromise) return rendererPromise;

  rendererPromise = (async () => {
    let esbuild;
    try {
      esbuild = await import('esbuild');
    } catch {
      throw new Error(
        'esbuild is required to render charts at build time; run `pnpm install` in the repo root',
      );
    }

    const outdir = path.join(os.tmpdir(), 'design-bakery-research-charts');
    await mkdir(outdir, { recursive: true });
    const outfile = path.join(outdir, `static-${process.pid}.mjs`);

    await esbuild.build({
      entryPoints: [STATIC_ENTRY],
      outfile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node22',
      jsx: 'automatic',
      logLevel: 'warning',
      define: { 'process.env.NODE_ENV': '"production"' },
    });

    return import(pathToFileURL(outfile).href);
  })();

  return rendererPromise;
}

/** esbuild resolves `esbuild` from the repo root only if it is a dependency there. */
export async function esbuildAvailable() {
  try {
    await import('esbuild');
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ assets */

export async function writeChartAsset(file, contents) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, contents);
}
