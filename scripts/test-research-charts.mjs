#!/usr/bin/env node
/**
 * research charts — the guard rails behind the ```chart fence.
 *
 * Run with `pnpm test:research-charts`. It is a plain Node script, like the
 * other tests in this repo: no runner, no config, `node:assert/strict`.
 *
 * It bundles `chart/static.tsx` with esbuild exactly the way the build step
 * does, so every assertion below is made against the same code the browser and
 * the static SVG use. There is no second implementation to test.
 *
 * Two groups of assertions are worth protecting above all others:
 *
 *  - **the numbers are the dataset's.** Every row is matched back to an
 *    observation in the file and compared field by field. If the browser ever
 *    starts averaging, pooling or otherwise inventing a number, this fails.
 *  - **the row shape is fixed.** `ChartRow` and `ChartTableRow` are asserted
 *    key-for-key against a literal list, and the entity payload is scanned for
 *    anything that looks like a test item or a gold label. Adding such a field
 *    has to fail here first, where a reviewer will see it.
 *
 * Usage:
 *   node scripts/test-research-charts.mjs
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  CHART_DIR,
  CHART_MODULE_DIR,
  CHART_WIDTHS,
  FRONTEND,
  ROOT,
  collectChartFences,
  findChartFences,
  loadStaticRenderer,
  relativeToRoot,
} from './research/chart-pipeline.mjs';

const renderer = await loadStaticRenderer();
const {
  CHART_COLORS,
  CHART_LEVELS,
  CSS_TOKEN_SOURCE,
  DIM_OPACITY,
  STACKED_BREAKPOINT,
  buildCsv,
  canonicalSpec,
  chartSlug,
  computeChartModel,
  csvCell,
  csvFileName,
  facetScopeFor,
  formatValue,
  layoutFor,
  parseChartSpec,
  renderResearchChartSvg,
  validateChartSpec,
} = renderer;

const DATASET_ID = 'eval-lab/judges-blind-760';
const DATASET_FILE = path.join(FRONTEND, 'public', 'research', 'data', 'judges-blind-760.json');
const GLOBALS_CSS = path.join(FRONTEND, 'src', 'styles', 'globals.css');
const DEMO_PAPER = path.join(
  FRONTEND,
  'src',
  'app',
  'modules',
  'research',
  'content',
  'db-r-2026-010.md',
);

const real = JSON.parse(await readFile(DATASET_FILE, 'utf8'));

/* ---------------------------------------------------------------- harness */

let checks = 0;
const failures = [];
const notes = [];

/** Every check runs, so one failure does not hide the rest. */
async function check(name, body) {
  try {
    await body();
    checks += 1;
  } catch (error) {
    failures.push(`${name}\n    ${String(error.message).split('\n').join('\n    ')}`);
  }
}

function note(message) {
  notes.push(message);
}

/* ----------------------------------------------------- synthetic dataset */

/** Built here, so the edge cases do not depend on eval-lab's exact numbers. */
function syntheticDataset(overrides = {}) {
  const entity = (id, options) => ({
    id,
    label: `Arm ${id.toUpperCase()}`,
    shortLabel: id.toUpperCase(),
    headline: options.headline ?? true,
    experiment: options.experiment ?? 'E1',
    experimentIds: [options.experiment ?? 'E1'],
    deployment: options.deployment ?? 'api',
    modelFamily: 'Test',
    modelId: `test/${id}`,
    paramsB: null,
    route: `route/${id}`,
    settings: {
      maxOutputTokens: 512,
      maxOutputTokensStatus: 'set',
      contextCapTokens: null,
      thinking: 'off',
      decoding: 'constant',
      temperature: 0,
    },
    settingsEvidence: [],
    derived: false,
    recordCount: 10,
    resolved: 10,
    correct: 5,
    statusCounts: { ok: 10 },
  });

  const observation = (id, slice, sliceValue, value, n, ci = 0.08) => ({
    entity: id,
    slice,
    sliceValue,
    metric: 'acc',
    value,
    ciLow: Math.max(0, value - ci),
    ciHigh: Math.min(1, value + ci),
    n,
  });

  const entities = [
    entity('a', { deployment: 'api', experiment: 'E1' }),
    entity('b', { deployment: 'local', experiment: 'E1' }),
    entity('c', { deployment: 'local', experiment: 'E2', headline: false }),
    entity('d', { deployment: 'api', experiment: 'E2', headline: false }),
  ];

  const base = { a: 0.9, b: 0.7, c: 0.5, d: 0.3 };
  const observations = [];
  for (const entry of entities) {
    observations.push(observation(entry.id, 'overall', 'all', base[entry.id], 10));
    observations.push(observation(entry.id, 'mode', 'pairwise', base[entry.id] + 0.05, 6));
    // `d` publishes no `single` slice: it must be counted as missing, never filled in.
    if (entry.id !== 'd') {
      observations.push(observation(entry.id, 'mode', 'single', base[entry.id] - 0.05, 4));
    }
  }
  // A second metric, so metric switching has something to switch to.
  observations.push({
    entity: 'a',
    slice: 'overall',
    sliceValue: 'all',
    metric: 'latency',
    value: 120,
    ciLow: null,
    ciHigh: null,
    n: 10,
  });

  return {
    kind: 'dataset',
    datasetId: 'test/tiny',
    schemaVersion: '1.0',
    title: 'Tiny synthetic set',
    recordCount: 40,
    levels: CHART_LEVELS.map((key) => ({ key, label: key, description: '' })),
    dimensions: [
      { key: 'entity', label: 'Arm', type: 'nominal', scope: 'entity', field: 'id' },
      {
        key: 'deployment',
        label: 'Local vs API',
        type: 'nominal',
        scope: 'entity',
        field: 'deployment',
        values: ['api', 'local'],
      },
      {
        key: 'experiment',
        label: 'Experiment',
        type: 'nominal',
        scope: 'entity',
        field: 'experimentIds',
        values: ['E1', 'E2'],
      },
      { key: 'mode', label: 'Mode', type: 'nominal', scope: 'slice', values: ['pairwise', 'single'] },
    ],
    measures: [
      {
        key: 'acc',
        label: 'Accuracy',
        unit: 'fraction',
        format: '.1%',
        better: 'higher',
        interval: 'wilson_95',
        definition: 'share correct',
        n: 'records',
      },
      {
        key: 'latency',
        label: 'Latency',
        unit: 'ms',
        format: ',.0f',
        better: 'lower',
        interval: 'none',
        definition: 'median',
        n: 'records',
      },
    ],
    entities,
    observations,
    aggregates: [],
    comparisons: [],
    experiments: [],
    runs: entities.map((entry, index) => ({
      entity: entry.id,
      experiment: entry.experiment,
      experimentDirectory: 'experiments/E1',
      runPath: `runs/${entry.id}`,
      path: `experiments/E1/runs/${entry.id}/predictions.jsonl`,
      sha256: String(index).repeat(64).slice(0, 64),
      mergeOrder: 0,
    })),
    notes: {},
    provenance: {
      summary: 'synthetic set for tests',
      repository: 'test/tiny',
      commit: 'abcdef1234567890',
      generator: 'test-research-charts.mjs',
      policy: { interval: 'wilson_95' },
    },
    ...overrides,
  };
}

const tiny = syntheticDataset();

/* ----------------------------------------------------------- spec parsing */

await check('parseChartSpec accepts a minimal spec', () => {
  const parsed = parseChartSpec('{"data":"a/b","metric":"m"}');
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.spec.data, 'a/b');
  assert.equal(parsed.spec.metric, 'm');
});

await check('parseChartSpec reports bad JSON instead of throwing', () => {
  const parsed = parseChartSpec('{ not json');
  assert.equal(parsed.spec, undefined);
  assert.match(parsed.error, /not valid JSON/);
});

await check('parseChartSpec never throws on junk', () => {
  for (const body of ['', 'null', '[]', '42', '"x"', '{"data":1}', '{}']) {
    const parsed = parseChartSpec(body);
    assert.equal(parsed.spec, undefined, `expected ${JSON.stringify(body)} to be rejected`);
    assert.ok(parsed.error, `expected an error message for ${JSON.stringify(body)}`);
  }
});

await check('parseChartSpec rejects an unknown type, level, sort or control', () => {
  assert.match(parseChartSpec('{"data":"a","metric":"m","type":"pie"}').error, /type/);
  assert.match(parseChartSpec('{"data":"a","metric":"m","level":"nope"}').error, /level/);
  assert.match(parseChartSpec('{"data":"a","metric":"m","sort":"random"}').error, /sort/);
  assert.match(parseChartSpec('{"data":"a","metric":"m","controls":["zoom"]}').error, /zoom/);
  assert.match(parseChartSpec('{"data":"a","metric":"m","controls":"all"}').error, /controls/);
});

await check('parseChartSpec allows controls: false', () => {
  const parsed = parseChartSpec('{"data":"a","metric":"m","controls":false}');
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.spec.controls, false);
});

/* ------------------------------------------------------------- validation */

await check('a valid spec validates clean against the real dataset', () => {
  const problems = validateChartSpec(real, {
    data: DATASET_ID,
    metric: 'all_record_accuracy',
    level: 'summary',
    highlight: ['ali_qwen38_flash_exp024'],
  });
  assert.deepEqual(problems, []);
});

await check('validation names the unknown metric and lists what exists', () => {
  const problems = validateChartSpec(real, { data: DATASET_ID, metric: 'nope' });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /unknown metric "nope"/);
  assert.match(problems[0], /all_record_accuracy/);
});

await check('validation rejects an unknown level, facet, filter and id', () => {
  assert.match(
    validateChartSpec(real, { data: DATASET_ID, metric: 'coverage', level: 'raw' })[0],
    /unknown level/,
  );
  assert.match(
    validateChartSpec(real, {
      data: DATASET_ID,
      metric: 'coverage',
      level: 'breakdown',
      facet: 'nope',
    })[0],
    /unknown facet/,
  );
  assert.match(
    validateChartSpec(real, { data: DATASET_ID, metric: 'coverage', filters: { nope: ['x'] } })[0],
    /unknown filter dimension/,
  );
  assert.match(
    validateChartSpec(real, {
      data: DATASET_ID,
      metric: 'coverage',
      filters: { deployment: ['mainframe'] },
    })[0],
    /allowed values/,
  );
  assert.match(
    validateChartSpec(real, { data: DATASET_ID, metric: 'coverage', entities: ['ghost'] })[0],
    /unknown entities/,
  );
  assert.match(
    validateChartSpec(real, { data: DATASET_ID, metric: 'coverage', highlight: ['ghost'] })[0],
    /unknown highlight/,
  );
  assert.match(
    validateChartSpec(real, { data: DATASET_ID, metric: 'coverage', colorBy: 'mode' })[0],
    /colorBy/,
  );
});

await check('validation catches a spec that names a different dataset than the file', () => {
  const problems = validateChartSpec(real, { data: 'other/set', metric: 'coverage' });
  assert.match(problems[0], /asks for dataset "other\/set"/);
});

await check('validation refuses a chart-kind file', () => {
  const chart = { ...tiny, kind: 'chart', datasetId: 'test/chart' };
  const problems = validateChartSpec(chart, { data: 'test/chart', metric: 'acc' });
  assert.match(problems[0], /not a dataset/);
});

await check('facet scope is enforced per level', () => {
  assert.equal(facetScopeFor('breakdown'), 'slice');
  assert.equal(facetScopeFor('experiments'), 'entity');
  assert.equal(facetScopeFor('summary'), undefined);
  assert.match(
    validateChartSpec(tiny, {
      data: 'test/tiny',
      metric: 'acc',
      level: 'breakdown',
      facet: 'experiment',
    })[0],
    /facets on a slice dimension/,
  );
  assert.match(
    validateChartSpec(tiny, {
      data: 'test/tiny',
      metric: 'acc',
      level: 'experiments',
      facet: 'mode',
    })[0],
    /facets on an entity dimension/,
  );
  assert.deepEqual(
    validateChartSpec(tiny, { data: 'test/tiny', metric: 'acc', level: 'experiments' }),
    [],
  );
});

/* --------------------------------------------------- compute: the numbers */

await check('every row is an observation from the file, field for field', () => {
  const specs = [
    { metric: 'all_record_accuracy', level: 'summary' },
    { metric: 'all_record_accuracy', level: 'breakdown', facet: 'mode' },
    { metric: 'all_record_accuracy', level: 'experiments', facet: 'experiment' },
    { metric: 'all_record_accuracy', level: 'runs' },
    { metric: 'coverage', level: 'summary' },
    { metric: 'median_resolved_latency_ms', level: 'runs' },
  ];

  for (const partial of specs) {
    const spec = { data: DATASET_ID, ...partial };
    const model = computeChartModel(real, spec);
    assert.ok(model.rows.length > 0, `${partial.level} produced no rows`);
    for (const row of model.rows) {
      const sliceValue = row.slice === 'overall' ? 'all' : row.facetKey;
      const source = real.observations.find(
        (entry) =>
          entry.entity === row.entityId &&
          entry.metric === model.measure.key &&
          entry.slice === row.slice &&
          entry.sliceValue === sliceValue,
      );
      assert.ok(
        source,
        `${partial.level}: no observation for ${row.entityId}/${row.slice}/${sliceValue}`,
      );
      assert.equal(row.value, source.value, `${row.entityId} value`);
      assert.equal(row.ciLow, source.ciLow, `${row.entityId} ciLow`);
      assert.equal(row.ciHigh, source.ciHigh, `${row.entityId} ciHigh`);
      assert.equal(row.n, source.n, `${row.entityId} n`);
    }
  }
});

await check('no row is dropped or duplicated against the published observations', () => {
  const model = computeChartModel(real, {
    data: DATASET_ID,
    metric: 'all_record_accuracy',
    level: 'runs',
  });
  const published = real.observations.filter(
    (entry) => entry.metric === 'all_record_accuracy' && entry.slice === 'overall',
  );
  assert.equal(model.rows.length, published.length);
  assert.equal(model.missing, 0);
  assert.equal(new Set(model.rows.map((row) => row.entityId)).size, real.entities.length);
});

await check('the chart row shape is fixed — no item-level or gold-label field can appear', () => {
  const model = computeChartModel(real, {
    data: DATASET_ID,
    metric: 'coverage',
    level: 'summary',
  });
  const expectedRowKeys = [
    'ciHigh',
    'ciLow',
    'colorValue',
    'entity',
    'entityId',
    'facetKey',
    'facetLabel',
    'id',
    'label',
    'n',
    'runs',
    'shortLabel',
    'slice',
    'value',
  ].sort();
  const expectedTableKeys = [
    'ciHigh',
    'ciLow',
    'entityId',
    'label',
    'n',
    'runs',
    'slice',
    'sliceValue',
    'value',
  ].sort();

  assert.ok(model.rows.length > 0);
  for (const row of model.rows) assert.deepEqual(Object.keys(row).sort(), expectedRowKeys);
  for (const row of model.tableRows) assert.deepEqual(Object.keys(row).sort(), expectedTableKeys);

  // The entity object is passed through whole, and it carries only arm-level
  // metadata. Anything that looks like a test item or a gold label is a bug.
  for (const row of model.rows) {
    const serialised = JSON.stringify(row.entity);
    assert.ok(
      !/gold|expected_answer|item_?id|question_?id|label_?text/i.test(serialised),
      `row for ${row.entityId} carries something that looks item-level`,
    );
  }
});

await check('summary shows the headline arms, runs shows every arm', () => {
  const summary = computeChartModel(real, {
    data: DATASET_ID,
    metric: 'coverage',
    level: 'summary',
  });
  const runs = computeChartModel(real, { data: DATASET_ID, metric: 'coverage', level: 'runs' });
  assert.equal(summary.rows.length, real.entities.filter((entry) => entry.headline).length);
  assert.equal(runs.rows.length, real.entities.length);
  assert.ok(summary.rows.length < runs.rows.length);
});

await check('a runs row carries the prediction files behind it, and nothing more', () => {
  const model = computeChartModel(real, { data: DATASET_ID, metric: 'coverage', level: 'runs' });
  for (const row of model.rows) {
    assert.ok(row.runs.length > 0, `${row.entityId} should have at least one run file`);
    for (const run of row.runs) {
      const published = real.runs.find((entry) => entry.path === run.path);
      assert.ok(published, `run ${run.path} is not in the dataset`);
      assert.equal(run.sha256, published.sha256);
      assert.match(run.path, /\.jsonl$/);
    }
  }
});

await check('filters narrow the arm set and never change a value', () => {
  const unfiltered = computeChartModel(tiny, { data: 'test/tiny', metric: 'acc', level: 'runs' });
  const filtered = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'runs',
    filters: { deployment: ['local'] },
  });

  assert.equal(filtered.rows.length, 2);
  assert.deepEqual(
    filtered.rows.map((row) => row.entityId).sort(),
    ['b', 'c'],
  );
  for (const row of filtered.rows) {
    const before = unfiltered.rows.find((entry) => entry.entityId === row.entityId);
    assert.deepEqual(
      [row.value, row.ciLow, row.ciHigh, row.n],
      [before.value, before.ciLow, before.ciHigh, before.n],
    );
  }
});

await check('a filter that matches nothing is empty, not zero', () => {
  const model = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'summary',
    filters: { deployment: ['mainframe'] },
  });
  assert.equal(model.empty, true);
  assert.equal(model.rows.length, 0);
  assert.deepEqual(model.domain, [0, 1]);
});

await check('highlight changes nothing about the data', () => {
  const plain = computeChartModel(tiny, { data: 'test/tiny', metric: 'acc', level: 'summary' });
  const lit = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'summary',
    highlight: ['b'],
  });
  assert.deepEqual(lit.rows, plain.rows);
  assert.deepEqual(lit.domain, plain.domain);
});

await check('a missing slice is counted as missing, never filled in', () => {
  const model = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'breakdown',
    facet: 'mode',
  });
  // Four arms, two slices, but `d` publishes no `single` observation.
  assert.equal(model.missing, 1);
  assert.equal(model.rows.length, 7);
  const single = model.facets.find((facet) => facet.key === 'single');
  assert.equal(single.rows.length, 3);
  assert.ok(!single.rows.some((row) => row.entityId === 'd'));
});

await check('breakdown facets share one x-domain', () => {
  const model = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'breakdown',
    facet: 'mode',
  });
  assert.equal(model.facetMode, 'slice');
  const lows = model.rows.map((row) => row.ciLow);
  const highs = model.rows.map((row) => row.ciHigh);
  assert.ok(model.domain[0] <= Math.min(...lows));
  assert.ok(model.domain[1] >= Math.max(...highs));
  assert.deepEqual(
    model.facets.map((facet) => facet.key),
    ['pairwise', 'single'],
  );
});

await check('experiments groups arms by an entity dimension, reading overall values', () => {
  const model = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'experiments',
    facet: 'experiment',
  });
  assert.equal(model.facetMode, 'entity');
  assert.deepEqual(
    model.facets.map((facet) => facet.key),
    ['E1', 'E2'],
  );
  assert.deepEqual(
    model.facets[0].rows.map((row) => row.entityId).sort(),
    ['a', 'b'],
  );
  assert.deepEqual(
    model.facets[1].rows.map((row) => row.entityId).sort(),
    ['c', 'd'],
  );
  for (const row of model.rows) {
    assert.equal(row.slice, 'overall');
    const source = tiny.observations.find(
      (entry) =>
        entry.entity === row.entityId && entry.slice === 'overall' && entry.metric === 'acc',
    );
    assert.equal(row.value, source.value);
  }
});

await check('switching level re-picks a facet of the right scope', () => {
  // `mode` is a slice dimension: the resolved default for a breakdown. Asking
  // for `experiments` must not silently produce an ungrouped chart.
  const model = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'experiments',
    facet: 'mode',
  });
  assert.equal(model.facetMode, 'entity');
  assert.equal(model.facetDimension.key, 'experiment');
});

await check('sorting follows the measure direction', () => {
  const higher = computeChartModel(tiny, { data: 'test/tiny', metric: 'acc', level: 'summary' });
  assert.deepEqual(
    higher.rows.map((row) => row.entityId),
    ['a', 'b'],
  );

  const byName = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'runs',
    sort: 'label',
  });
  assert.deepEqual(
    byName.rows.map((row) => row.label),
    [...byName.rows.map((row) => row.label)].sort(),
  );

  const exportOrder = computeChartModel(tiny, {
    data: 'test/tiny',
    metric: 'acc',
    level: 'runs',
    sort: 'none',
  });
  assert.deepEqual(
    exportOrder.rows.map((row) => row.entityId),
    ['a', 'b', 'c', 'd'],
  );
});

await check('a fraction measure never draws an axis outside 0–100%', () => {
  const model = computeChartModel(real, { data: DATASET_ID, metric: 'coverage', level: 'runs' });
  assert.ok(model.domain[0] >= 0, `domain starts at ${model.domain[0]}`);
  assert.ok(model.domain[1] <= 1, `domain ends at ${model.domain[1]}`);
});

await check('table level is one row per published observation, and no finer', () => {
  const model = computeChartModel(real, { data: DATASET_ID, metric: 'coverage', level: 'table' });
  const published = real.observations.filter((entry) => entry.metric === 'coverage');
  assert.equal(model.tableRows.length, published.length);
  assert.equal(model.rows.length, 0);
  assert.deepEqual(model.facets, []);
  const pairs = new Set(
    model.tableRows.map((row) => `${row.entityId}|${row.slice}|${row.sliceValue}`),
  );
  assert.equal(pairs.size, model.tableRows.length, 'table rows must be unique per arm and slice');
});

await check('an unknown metric falls back to the first measure instead of crashing', () => {
  const model = computeChartModel(tiny, { data: 'test/tiny', metric: 'nope', level: 'summary' });
  assert.equal(model.measure.key, 'acc');
});

/* ------------------------------------------------------------------ layout */

await check('the layout stacks below 560px and never rotates a label', () => {
  const model = computeChartModel(tiny, { data: 'test/tiny', metric: 'acc', level: 'runs' });
  assert.equal(layoutFor(model, 720, 'inline').mode, 'horizontal');
  assert.equal(layoutFor(model, STACKED_BREAKPOINT, 'inline').mode, 'horizontal');
  assert.equal(layoutFor(model, STACKED_BREAKPOINT - 1, 'inline').mode, 'stacked');
  assert.equal(layoutFor(model, 390, 'inline').mode, 'stacked');

  const stacked = layoutFor(model, 390, 'inline');
  assert.equal(stacked.labelWidth, stacked.width - 10 - 12, 'a stacked label uses the full width');
  assert.ok(stacked.rowHeight > layoutFor(model, 720, 'inline').rowHeight);
});

await check('height grows with the row count', () => {
  const small = computeChartModel(tiny, { data: 'test/tiny', metric: 'acc', level: 'summary' });
  const large = computeChartModel(tiny, { data: 'test/tiny', metric: 'acc', level: 'runs' });
  assert.ok(layoutFor(large, 720, 'inline').height > layoutFor(small, 720, 'inline').height);
});

/* -------------------------------------------------------------- the files */

await check('the static SVG is literal colour, one file per theme', () => {
  const spec = { data: DATASET_ID, metric: 'all_record_accuracy', level: 'summary' };
  const light = renderResearchChartSvg(real, spec, { theme: 'light', width: CHART_WIDTHS.wide });
  const dark = renderResearchChartSvg(real, spec, { theme: 'dark', width: CHART_WIDTHS.wide });

  for (const result of [light, dark]) {
    assert.ok(
      result.svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),
      'needs an XML prologue',
    );
    assert.ok(result.svg.includes('<svg'), 'must contain an svg element');
    assert.ok(result.height > 0, 'height must be measurable');
    assert.equal(result.width, CHART_WIDTHS.wide);
    assert.ok(
      !result.svg.includes('var(--rc-'),
      'an SVG loaded through <img> cannot read CSS variables',
    );
  }
  assert.ok(light.svg.includes(CHART_COLORS.light.ink));
  assert.ok(dark.svg.includes(CHART_COLORS.dark.ink));
  assert.notEqual(light.svg, dark.svg);
});

await check('the static SVG carries the same rows as the interactive model', () => {
  const spec = { data: DATASET_ID, metric: 'all_record_accuracy', level: 'experiments' };
  const model = computeChartModel(real, spec);
  const result = renderResearchChartSvg(real, spec, { theme: 'light', width: CHART_WIDTHS.wide });
  assert.ok(model.rows.length > 0);
  for (const row of model.rows) {
    assert.ok(
      result.svg.includes(formatValue(model.measure, row.value)),
      `static SVG is missing ${row.entityId}'s value`,
    );
  }
});

await check('the narrow render is a different file from the wide one', () => {
  const spec = { data: DATASET_ID, metric: 'coverage', level: 'summary' };
  const wide = renderResearchChartSvg(real, spec, { theme: 'light', width: CHART_WIDTHS.wide });
  const narrow = renderResearchChartSvg(real, spec, { theme: 'light', width: CHART_WIDTHS.narrow });
  assert.equal(narrow.width, CHART_WIDTHS.narrow);
  assert.notEqual(wide.svg, narrow.svg);
  assert.ok(narrow.height > wide.height, 'stacked rows are taller');
});

await check('a fraction axis is clamped, so no negative percentage is drawn', () => {
  const spec = { data: DATASET_ID, metric: 'coverage', level: 'summary' };
  const result = renderResearchChartSvg(real, spec, { theme: 'light', width: CHART_WIDTHS.wide });
  const negative = result.svg.match(/-[\d.]+%/g) ?? [];
  assert.deepEqual(negative, [], `negative percentages in the axis: ${negative.join(', ')}`);
});

await check('table level renders through the table renderer', () => {
  const spec = { data: DATASET_ID, metric: 'coverage', level: 'table' };
  const result = renderResearchChartSvg(real, spec, { theme: 'light', width: CHART_WIDTHS.wide });
  assert.ok(result.svg.includes('Arm'), 'the table renderer draws its own header');
  assert.ok(result.height > 0);
  assert.match(result.summary, /level table/);
});

/* -------------------------------------------------------------------- CSV */

await check('the CSV is a re-export of the published rows', () => {
  const spec = { data: DATASET_ID, metric: 'coverage', level: 'breakdown', facet: 'mode' };
  const model = computeChartModel(real, spec);
  const csv = buildCsv({
    datasetId: real.datasetId,
    metric: model.measure.key,
    measure: model.measure,
    level: model.level,
    rows: model.tableRows,
  });
  const lines = csv.trimEnd().split('\n');
  assert.equal(
    lines[0],
    'entity,label,slice,slice_value,metric,value,ci_low,ci_high,n,run_paths,dataset,level',
  );
  assert.equal(lines.length, model.tableRows.length + 1);
  assert.ok(csv.endsWith('\n'));
  // Every row carries its own arm id and its published number — the file is a
  // re-export, so a blank or invented column here would be a silent data loss.
  for (const row of model.tableRows) {
    assert.ok(
      csv.includes(`${row.entityId},${csvCell(row.label)},`),
      `CSV is missing a row for ${row.entityId}`,
    );
    assert.ok(csv.includes(`,${row.value},`), `CSV is missing ${row.entityId}'s value`);
  }
  assert.ok(csv.includes('runs/'), 'the run_paths column should carry the prediction files');
});

await check('CSV cells are quoted per RFC 4180', () => {
  const csv = buildCsv({
    datasetId: 'test/tiny',
    metric: 'acc',
    measure: tiny.measures[0],
    level: 'runs',
    rows: [
      {
        entityId: 'a',
        label: 'Comma, "quote" and\nnewline',
        slice: 'overall',
        sliceValue: 'all',
        value: 0.5,
        ciLow: 0.4,
        ciHigh: 0.6,
        n: 10,
        runs: [{ path: 'runs/a/predictions.jsonl' }],
      },
    ],
  });
  assert.ok(csv.includes('"Comma, ""quote"" and\nnewline"'));
});

await check('the download file name is safe and stable', () => {
  assert.equal(
    csvFileName('eval-lab/judges-blind-760', 'all_record_accuracy', 'summary'),
    'eval-lab-judges-blind-760-all-record-accuracy-summary.csv',
  );
});

/* ----------------------------------------------------------------- fences */

await check('findChartFences reads a body and stops at the closing fence', () => {
  const markdown = ['# t', '```chart', '{"data":"a","metric":"m"}', '```', 'after'].join('\n');
  const fences = findChartFences(markdown, 'x.md');
  assert.equal(fences.length, 1);
  assert.equal(fences[0].line, 2);
  assert.equal(fences[0].body, '{"data":"a","metric":"m"}');
});

await check('findChartFences handles CRLF, indentation and non-chart fences', () => {
  const markdown = [
    '```js',
    'const x = 1;',
    '```',
    '  ```chart  ',
    '  {"data":"a","metric":"m"}  ',
    '  ```',
  ].join('\r\n');
  const fences = findChartFences(markdown, 'x.md');
  assert.equal(fences.length, 1, 'only the chart fence should match');
  assert.equal(fences[0].line, 4);
  assert.equal(JSON.parse(fences[0].body).metric, 'm');
});

await check('the demo chart in db-r-2026-010.md parses and validates', async () => {
  const markdown = await readFile(DEMO_PAPER, 'utf8');
  const fences = findChartFences(markdown, DEMO_PAPER);
  assert.equal(fences.length, 1, 'the demo paper should carry exactly one chart fence');
  const parsed = parseChartSpec(fences[0].body);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.spec.data, DATASET_ID);
  assert.deepEqual(validateChartSpec(real, parsed.spec), []);
});

await check('the demo chart is the only change to that paper', async () => {
  const markdown = await readFile(DEMO_PAPER, 'utf8');
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const open = lines.findIndex((line) => line.trim() === '```chart');
  const close = lines.findIndex((line, index) => index > open && line.trim() === '```');
  assert.ok(open > 0 && close > open);
  assert.equal(close - open, 9, 'the demo fence is 8 lines of JSON plus its closing fence');
});

await check('the slug is a pure function of the spec', () => {
  const one = { data: DATASET_ID, metric: 'coverage', level: 'summary' };
  const two = { level: 'summary', metric: 'coverage', data: DATASET_ID };
  assert.equal(chartSlug(one), chartSlug(two), 'key order must not change the slug');
  assert.notEqual(chartSlug(one), chartSlug({ ...one, level: 'runs' }));
  assert.equal(canonicalSpec(one), canonicalSpec(two));
  assert.match(chartSlug(one), /^dot-ci-summary-coverage-[0-9a-f]{8}$/);
});

/* ------------------------------------------- the build-time assets on disk */

const manifestPath = path.join(CHART_DIR, 'manifest.json');
if (!existsSync(manifestPath)) {
  note(
    `${relativeToRoot(manifestPath)} is missing — run \`pnpm research:validate-charts\` to write the static SVGs`,
  );
} else {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const fences = await collectChartFences();

  await check('every fence has a rendered chart in the manifest', () => {
    const keys = new Set(manifest.charts.map((chart) => `${chart.paperId}/${chart.chartId}`));
    for (const fence of fences) {
      const parsed = parseChartSpec(fence.body);
      assert.equal(parsed.error, undefined, `${relativeToRoot(fence.file)}:${fence.line}`);
      assert.ok(
        keys.has(`${fence.paperId}/${chartSlug(parsed.spec)}`),
        `${relativeToRoot(fence.file)}:${fence.line} has no rendered chart; re-run the validator`,
      );
    }
    assert.equal(manifest.charts.length, fences.length);
  });

  await check('the manifest records provenance and every variant file exists', () => {
    assert.ok(manifest.charts.length > 0, 'the manifest is empty');
    for (const chart of manifest.charts) {
      assert.ok(chart.dataset.id, `${chart.chartId} has no dataset id`);
      assert.ok(chart.dataset.schemaVersion, `${chart.chartId} has no schemaVersion`);
      assert.ok(chart.source.file && chart.source.line, `${chart.chartId} has no source location`);
      assert.ok(chart.canonicalSpec, `${chart.chartId} has no canonical spec`);
      assert.deepEqual(
        Object.keys(chart.variants).sort(),
        ['dark.narrow', 'dark.wide', 'light.narrow', 'light.wide'],
      );
      for (const variant of Object.values(chart.variants)) {
        assert.ok(variant.sha256 && variant.bytes > 0, `${chart.chartId} variant is empty`);
        assert.ok(
          existsSync(path.join(ROOT, 'frontend', 'public', variant.path.replace(/^\//, ''))),
          `${variant.path} is missing`,
        );
      }
    }
  });
}

/* -------------------------------------------------------- css token drift */

function cssBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return '';
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  if (open === -1 || close === -1) return '';
  return css.slice(open + 1, close);
}

await check('globals.css declares exactly the tokens theme.ts builds', async () => {
  const css = await readFile(GLOBALS_CSS, 'utf8');
  const blocks = {
    light: cssBlock(css, '.rc-chart {'),
    dark: cssBlock(css, '.dark .rc-chart {'),
  };
  for (const theme of ['light', 'dark']) {
    assert.ok(blocks[theme], `globals.css has no ${theme} .rc-chart token block`);
    for (const [token, value] of Object.entries(CSS_TOKEN_SOURCE[theme])) {
      assert.ok(
        blocks[theme].includes(`${token}: ${value};`),
        `${theme} ${token} should be ${value} in globals.css`,
      );
    }
  }
  assert.notEqual(CSS_TOKEN_SOURCE.light['--rc-ink'], CSS_TOKEN_SOURCE.dark['--rc-ink']);
  assert.equal(String(DIM_OPACITY.dark), CSS_TOKEN_SOURCE.dark['--rc-dim']);
});

await check('every --rc-* variable the chart asks for is declared', async () => {
  const css = await readFile(GLOBALS_CSS, 'utf8');
  const declared = new Set(css.match(/--rc-[a-z0-9-]+(?=\s*:)/g) ?? []);
  const files = (await readdir(CHART_MODULE_DIR)).filter((name) => /\.tsx?$/.test(name));
  assert.ok(files.length > 0);
  for (const name of files) {
    const source = await readFile(path.join(CHART_MODULE_DIR, name), 'utf8');
    for (const reference of source.match(/var\((--rc-[a-z0-9-]+)\)/g) ?? []) {
      const token = reference.slice(4, -1);
      assert.ok(declared.has(token), `${name} uses ${token}, which globals.css never declares`);
    }
  }
});

/* ----------------------------------------------------------------- report */

for (const message of notes) console.log(`research:test-charts — note: ${message}`);

if (failures.length > 0) {
  console.error(`research:test-charts — ${failures.length} of ${checks} check(s) failed:\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}\n`);
  process.exitCode = 1;
} else {
  console.log(`research:test-charts — ${checks} check(s) passed`);
}
