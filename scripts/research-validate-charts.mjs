#!/usr/bin/env node
/**
 * research:validate-charts — the build's guard rail for ```chart fences.
 *
 * Runs in `prebuild` (and `predev`), next to the sitemap. It does three jobs:
 *
 *  1. **Validates.** Every fence must parse, name a published dataset, and
 *     reference a metric, level, facet, filter value, entity and highlight that
 *     the dataset actually contains. A typo fails the build here rather than
 *     rendering an empty chart on a published paper.
 *  2. **Verifies the data.** Every synced file is hashed against the sha256 in
 *     `paper/data/index.json`, so the two repositories cannot drift silently.
 *  3. **Renders the fallback.** Light and dark SVGs at two widths, from the same
 *     React component the browser uses, plus a manifest that records the spec,
 *     the source line and the hash of every file.
 *
 * Usage:
 *   node scripts/research-validate-charts.mjs           # validate + write assets
 *   node scripts/research-validate-charts.mjs --check   # validate, fail if assets are stale
 *   node scripts/research-validate-charts.mjs --quiet   # only print problems
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CHART_DIR,
  CHART_WIDTHS,
  collectChartFences,
  datasetFileFor,
  loadDatasetIndex,
  loadStaticRenderer,
  readDataset,
  relativeToRoot,
  sha256,
  toPosix,
  writeChartAsset,
} from './research/chart-pipeline.mjs';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const quiet = args.includes('--quiet');

function log(message) {
  if (!quiet) console.log(message);
}

function fail(message) {
  console.error(`research:validate-charts — ${message}`);
  process.exitCode = 1;
}

/**
 * The validator has to use the same spec parser the browser does, so it imports
 * it through the same esbuild bundle that renders the SVG.
 */
async function main() {
  const renderer = await loadStaticRenderer();
  const { parseChartSpec, validateChartSpec, chartSlug, canonicalSpec } = renderer;

  if (typeof parseChartSpec !== 'function' || typeof validateChartSpec !== 'function') {
    fail('the static renderer did not export the spec helpers; check chart/static.tsx');
    return;
  }

  const index = await loadDatasetIndex();
  if (index.schemaVersion !== '1.0') {
    fail(`unsupported chart-data schemaVersion ${JSON.stringify(index.schemaVersion)}`);
    return;
  }

  const problems = [];

  // 1. Data integrity: the site renders committed bytes, so they must be the
  //    bytes upstream published.
  for (const file of index.files ?? []) {
    if (file.kind === 'schema') continue;
    const { absolute } = await datasetFileFor(index, file.id).catch(() => ({ absolute: null }));
    if (!absolute) {
      problems.push(`${file.path}: not synced (run \`pnpm research:sync-data\`)`);
      continue;
    }
    const actual = sha256(await readFile(absolute));
    if (actual !== file.sha256) {
      problems.push(`${file.path}: sha256 ${actual} but index.json says ${file.sha256}`);
    }
  }

  // 2. Every fence.
  const fences = await collectChartFences();
  const rendered = [];
  const seenSlugs = new Map();
  const datasetCache = new Map();

  for (const fence of fences) {
    const where = `${relativeToRoot(fence.file)}:${fence.line}`;
    const parsed = parseChartSpec(fence.body);
    if (!parsed.spec) {
      problems.push(`${where}: ${parsed.error}`);
      continue;
    }
    const spec = parsed.spec;

    if (!datasetCache.has(spec.data)) {
      try {
        datasetCache.set(spec.data, await readDataset(index, spec.data));
      } catch (error) {
        problems.push(`${where}: ${error.message}`);
        continue;
      }
    }
    const dataset = datasetCache.get(spec.data);

    const specProblems = validateChartSpec(dataset, spec);
    if (specProblems.length > 0) {
      for (const problem of specProblems) problems.push(`${where}: ${problem}`);
      continue;
    }

    const slug = chartSlug(spec);
    const key = `${fence.paperId}/${slug}`;
    const duplicate = seenSlugs.get(key);
    if (duplicate) {
      // Only reachable on a 32-bit hash collision, but a silent overwrite would
      // publish the wrong figure, so treat it as a hard failure.
      problems.push(
        `${where}: chart id ${slug} collides with ${duplicate}; give one of them a distinct spec`,
      );
      continue;
    }
    seenSlugs.set(key, where);

    const variants = {};
    for (const theme of ['light', 'dark']) {
      for (const [size, width] of Object.entries(CHART_WIDTHS)) {
        const result = renderer.renderResearchChartSvg(dataset, spec, { theme, width });
        const name = size === 'wide' ? `${slug}.${theme}.svg` : `${slug}.${theme}.narrow.svg`;
        const absolute = path.join(CHART_DIR, fence.paperId, name);
        const publicPath = `/research/charts/${fence.paperId}/${name}`;
        variants[`${theme}.${size}`] = {
          path: publicPath,
          width: result.width,
          height: result.height,
          bytes: Buffer.byteLength(result.svg),
          sha256: sha256(Buffer.from(result.svg, 'utf8')),
          summary: result.summary,
        };
        if (!checkOnly) await writeChartAsset(absolute, result.svg);
      }
    }

    rendered.push({
      paperId: fence.paperId,
      chartId: slug,
      spec,
      canonicalSpec: canonicalSpec(spec),
      dataset: {
        id: dataset.datasetId,
        title: dataset.title,
        schemaVersion: dataset.schemaVersion,
        repository: dataset.provenance?.repository,
        commit: dataset.provenance?.commit,
        generator: dataset.provenance?.generator,
        policy: dataset.provenance?.policy,
      },
      source: { file: relativeToRoot(fence.file), line: fence.line },
      variants,
    });
  }

  if (problems.length > 0) {
    fail(`${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    return;
  }

  const manifest = {
    schemaVersion: '1.0',
    note: 'Generated by scripts/research-validate-charts.mjs. Do not edit by hand.',
    chartWidths: CHART_WIDTHS,
    charts: rendered,
  };
  const manifestPath = path.join(CHART_DIR, 'manifest.json');
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;

  if (checkOnly) {
    if (!existsSync(manifestPath) || (await readFile(manifestPath, 'utf8')) !== manifestJson) {
      fail('research chart assets are stale; run `pnpm research:validate-charts`');
      return;
    }
    for (const chart of rendered) {
      for (const variant of Object.values(chart.variants)) {
        const absolute = path.join(
          CHART_DIR,
          chart.paperId,
          path.basename(variant.path),
        );
        if (!existsSync(absolute) || sha256(await readFile(absolute)) !== variant.sha256) {
          fail(`${toPosix(variant.path)} is missing or stale`);
          return;
        }
      }
    }
    log(
      `research:validate-charts — ${rendered.length} chart(s) valid, assets up to date`,
    );
    return;
  }

  await writeChartAsset(manifestPath, manifestJson);
  log(
    `research:validate-charts — ${rendered.length} chart(s) in ${new Set(
      rendered.map((chart) => chart.paperId),
    ).size} file(s); wrote ${
      rendered.length * Object.keys(CHART_WIDTHS).length * 2
    } SVG(s) and ${toPosix(path.relative(process.cwd(), manifestPath))}`,
  );
  for (const chart of rendered) {
    const wide = chart.variants['light.wide'];
    log(`  ✓ ${chart.paperId}/${chart.chartId} — ${wide.summary}`);
  }
}

main().catch((error) => {
  fail(error.stack ?? error.message);
});
