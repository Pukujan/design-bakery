/**
 * `computeChartModel` — the only place chart geometry gets its numbers.
 *
 * Pure: dataset + spec + reader state in, rows out. No DOM, no fetch, no
 * randomness. That is what lets the interactive component and the build-time
 * static SVG renderer share one code path, and it is what makes the whole
 * thing testable without a browser.
 *
 * Two rules are structural, not advisory:
 *
 *  - **No cross-entity arithmetic.** Rows are read straight out of
 *    `dataset.observations`; nothing is averaged, pooled or re-derived. If an
 *    aggregate is wanted, the exporter has to publish it in `aggregates` with a
 *    stated method — the browser never invents one.
 *  - **No per-record detail.** The finest granularity this can emit is one row
 *    per arm per slice, which is exactly what the dataset file contains. There
 *    is no code path that could reach an individual test item or a gold label.
 */
import { ascending, descending, extent, max } from 'd3-array';
import type { Dataset, Dimension, Entity, Measure, Observation } from './types.generated';
import {
  CHART_LEVELS,
  defaultFacetKey,
  dimensionByKey,
  dimensionValues,
  entityDimensions,
  facetScopeFor,
  measureByKey,
  resolveSpec,
  type ChartLevel,
  type ChartSort,
  type ChartSpec,
  type ChartType,
} from './spec';

/** Observation keys are built from three author-supplied strings; NUL cannot appear in any. */
const KEY_SEPARATOR = '\u0000';

/** One hashed prediction file behind a row. Paths only — never their contents. */
export interface ChartRunRef {
  experiment: string;
  runPath: string;
  path: string;
  sha256: string;
  mergeOrder: number;
}

export interface ChartRow {
  /** Unique inside one model: entity id, or entity + facet for a facetted level. */
  id: string;
  entityId: string;
  label: string;
  shortLabel: string;
  value: number | null;
  ciLow: number | null;
  ciHigh: number | null;
  n: number;
  /** Value of the `colorBy` dimension, used to pick a palette slot. */
  colorValue: string;
  /** `sliceValue` for a breakdown row, facet value for an experiments row, empty otherwise. */
  facetKey: string;
  facetLabel: string;
  slice: string;
  entity: Entity;
  /** The prediction files this row's number came from. */
  runs: ChartRunRef[];
}

export interface ChartFacet {
  key: string;
  label: string;
  rows: ChartRow[];
  /** Records behind the slice, for the facet header. */
  records: number;
}

export interface ChartTableRow {
  entityId: string;
  label: string;
  slice: string;
  sliceValue: string;
  value: number | null;
  ciLow: number | null;
  ciHigh: number | null;
  n: number;
  runs: ChartRunRef[];
}

/** How a level groups rows: nothing, by slice value, or by an entity dimension. */
export type ChartFacetMode = 'none' | 'slice' | 'entity';

export interface ChartModel {
  measure: Measure;
  level: ChartLevel;
  type: ChartType;
  sort: ChartSort;
  facetMode: ChartFacetMode;
  facets: ChartFacet[];
  /** Flattened rows in display order. Empty for `level: "table"`. */
  rows: ChartRow[];
  tableRows: ChartTableRow[];
  /** Sorted values of the `colorBy` dimension, for stable palette slots. */
  seriesValues: string[];
  /** Shared x-domain. Facets deliberately share one scale. */
  domain: [number, number];
  /** Entities kept by the current filters. */
  entityCount: number;
  /** Entities the level would have shown before filtering. */
  eligibleCount: number;
  /** Entities in the dataset, filter-independent. */
  totalEntityCount: number;
  /** Arm/slice combinations the dataset has no observation for. */
  missing: number;
  facetDimension?: Dimension;
  empty: boolean;
}

export interface ChartState {
  metric?: string;
  level?: ChartLevel;
  type?: ChartType;
  sort?: ChartSort;
  filters?: Record<string, string[]>;
  entities?: string[];
  highlight?: string[];
  facet?: string;
  colorBy?: string;
}

function numeric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Default entity set for a level, before filters. */
function eligibleEntities(dataset: Dataset, level: ChartLevel, explicit: string[]): Entity[] {
  if (explicit.length > 0) {
    const wanted = new Set(explicit);
    return dataset.entities.filter((entity) => wanted.has(entity.id));
  }
  if (level === 'summary') {
    const headline = dataset.entities.filter((entity) => entity.headline);
    // A dataset with no headline flag falls back to everything rather than
    // rendering an empty chart.
    return headline.length > 0 ? headline : dataset.entities;
  }
  // breakdown, experiments, runs and table all read the full arm list; `runs`
  // is the level whose whole point is that it shows every arm and its files.
  return dataset.entities;
}

function matchesFilters(
  dataset: Dataset,
  entity: Entity,
  filters: Record<string, string[]>,
): boolean {
  for (const [key, values] of Object.entries(filters)) {
    if (!values || values.length === 0) continue;
    const dimension = dimensionByKey(dataset, key);
    if (!dimension || dimension.scope !== 'entity') continue;
    const own = dimensionValues(entity, dimension);
    if (!own.some((value) => values.includes(value))) return false;
  }
  return true;
}

function observationKey(entityId: string, slice: string, sliceValue: string): string {
  return [entityId, slice, sliceValue].join(KEY_SEPARATOR);
}

function observationIndex(dataset: Dataset, metric: string): Map<string, Observation> {
  const index = new Map<string, Observation>();
  for (const observation of dataset.observations) {
    if (observation.metric !== metric) continue;
    index.set(
      observationKey(observation.entity, observation.slice, observation.sliceValue),
      observation,
    );
  }
  return index;
}

/** Prediction files per arm. Paths and hashes only; the file itself is never read. */
function runIndex(dataset: Dataset): Map<string, ChartRunRef[]> {
  const index = new Map<string, ChartRunRef[]>();
  for (const run of dataset.runs ?? []) {
    const list = index.get(run.entity) ?? [];
    list.push({
      experiment: run.experiment,
      runPath: run.runPath,
      path: run.path,
      sha256: run.sha256,
      mergeOrder: run.mergeOrder,
    });
    index.set(run.entity, list);
  }
  for (const list of index.values()) {
    list.sort((left, right) => ascending(left.mergeOrder, right.mergeOrder));
  }
  return index;
}

function orderRows(rows: ChartRow[], sort: ChartSort, better: Measure['better']): ChartRow[] {
  if (sort === 'none') return rows;
  if (sort === 'label') {
    return [...rows].sort((left, right) => ascending(left.label, right.label));
  }
  const direction = better === 'lower' ? ascending : descending;
  return [...rows].sort((left, right) => {
    const leftValue = numeric(left.value);
    const rightValue = numeric(right.value);
    // Missing values always sink, whatever the direction.
    if (leftValue === null && rightValue === null) return ascending(left.label, right.label);
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;
    const ordered = direction(leftValue, rightValue);
    return ordered !== 0 ? ordered : ascending(left.label, right.label);
  });
}

/** The x-domain, shared by every facet. Padding so whiskers and dots are not clipped. */
function computeDomain(
  rows: ChartRow[],
  type: ChartType,
  measure: Measure | undefined,
): [number, number] {
  const lows: number[] = [];
  const highs: number[] = [];
  for (const row of rows) {
    const value = numeric(row.value);
    const low = numeric(row.ciLow) ?? value;
    const high = numeric(row.ciHigh) ?? value;
    if (low !== null) lows.push(low);
    if (high !== null) highs.push(high);
  }

  const [lowMin, highMax] = extent([...lows, ...highs]);
  if (lowMin === undefined || highMax === undefined) return [0, 1];

  let min = lowMin;
  let max = highMax;
  if (type === 'bar') min = Math.min(0, min);

  const span = max - min;
  const pad = span > 0 ? span * 0.06 : Math.max(Math.abs(max) * 0.05, 1e-9);
  min -= pad;
  max += pad;

  // A fraction cannot leave [0, 1]; clamping keeps the axis honest instead of
  // drawing a "−0.4% accuracy" tick.
  if (measure?.unit === 'fraction') {
    min = Math.max(0, min);
    max = Math.min(1, max);
    if (min >= max) max = Math.min(1, min + 1e-6);
  }
  return [min, max];
}

export function computeChartModel(
  dataset: Dataset,
  spec: ChartSpec,
  state: ChartState = {},
): ChartModel {
  const resolved = resolveSpec(spec, dataset);
  const level = (state.level ?? resolved.level) as ChartLevel;
  const type = (state.type ?? resolved.type) as ChartType;
  const sort = (state.sort ?? resolved.sort) as ChartSort;
  const metric = state.metric ?? resolved.metric;
  const filters = state.filters ?? resolved.filters;
  const explicitEntities = state.entities ?? resolved.entities;
  const colorByKey = state.colorBy ?? resolved.colorBy;

  const measure = measureByKey(dataset, metric) ?? dataset.measures[0];
  // A facet key only applies when the level facets on that scope. When the
  // reader switches level the previous key no longer fits — a `breakdown`
  // facet is a slice dimension, an `experiments` facet is an entity dimension —
  // so fall back to that level's own default rather than silently ungrouping.
  const wantedFacetScope = facetScopeFor(safeLevel);
  const facetCandidates = [state.facet ?? resolved.facet, defaultFacetKey(dataset, safeLevel)];
  let facetDimension: Dimension | undefined;
  for (const key of facetCandidates) {
    const dimension = key ? dimensionByKey(dataset, key) : undefined;
    if (dimension && dimension.scope === wantedFacetScope) {
      facetDimension = dimension;
      break;
    }
  }
  const facetMode: ChartFacetMode = facetDimension ? (wantedFacetScope as 'slice' | 'entity') : 'none';

  const eligible = eligibleEntities(dataset, safeLevel, explicitEntities);
  const kept = eligible.filter((entity) => matchesFilters(dataset, entity, filters));

  const colorDimension = colorByKey ? dimensionByKey(dataset, colorByKey) : undefined;
  const seriesValues = [
    ...new Set(
      dataset.entities.flatMap((entity) =>
        colorDimension ? dimensionValues(entity, colorDimension) : ['all'],
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));

  const observations = observationIndex(dataset, measure?.key ?? metric);
  const runs = runIndex(dataset);

  const base: Omit<ChartModel, 'facets' | 'rows' | 'domain' | 'tableRows' | 'missing' | 'empty'> = {
    measure: measure as Measure,
    level: safeLevel,
    type,
    sort,
    facetMode,
    seriesValues,
    entityCount: kept.length,
    eligibleCount: eligible.length,
    totalEntityCount: dataset.entities.length,
    facetDimension,
  };

  const makeRow = (
    entity: Entity,
    observation: Observation | undefined,
    facet: { key: string; label: string },
  ): ChartRow => ({
    id: facet.key ? `${entity.id}${KEY_SEPARATOR}${facet.key}` : entity.id,
    entityId: entity.id,
    label: entity.label,
    shortLabel: entity.shortLabel || entity.label,
    value: numeric(observation?.value),
    ciLow: numeric(observation?.ciLow),
    ciHigh: numeric(observation?.ciHigh),
    n: observation?.n ?? 0,
    colorValue: colorDimension ? dimensionValues(entity, colorDimension)[0] ?? 'all' : 'all',
    facetKey: facet.key,
    facetLabel: facet.label,
    slice: observation?.slice ?? 'overall',
    entity,
    runs: runs.get(entity.id) ?? [],
  });

  if (safeLevel === 'table') {
    // "Raw" means one row per arm per slice per metric: the finest thing the
    // export contains. It is not a per-question view and cannot become one.
    const tableRows: ChartTableRow[] = dataset.observations
      .filter(
        (observation) =>
          observation.metric === (measure?.key ?? metric) &&
          kept.some((entity) => entity.id === observation.entity),
      )
      .map((observation) => {
        const entity = dataset.entities.find((entry) => entry.id === observation.entity);
        return {
          entityId: observation.entity,
          label: entity?.label ?? observation.entity,
          slice: observation.slice,
          sliceValue: observation.sliceValue,
          value: numeric(observation.value),
          ciLow: numeric(observation.ciLow),
          ciHigh: numeric(observation.ciHigh),
          n: observation.n,
          runs: runs.get(observation.entity) ?? [],
        };
      })
      .sort(
        (left, right) =>
          ascending(left.slice, right.slice) ||
          ascending(left.sliceValue, right.sliceValue) ||
          ascending(left.label, right.label),
      );

    return {
      ...base,
      facets: [],
      rows: [],
      tableRows,
      domain: [0, 1],
      missing: 0,
      empty: tableRows.length === 0,
    };
  }

  const facets: ChartFacet[] = [];
  let missing = 0;

  if (facetMode === 'slice' && facetDimension) {
    const declared = facetDimension.values ?? [];
    const present = [
      ...new Set(
        dataset.observations
          .filter((observation) => observation.slice === facetDimension.key)
          .map((observation) => observation.sliceValue),
      ),
    ];
    const order = [
      ...declared.filter((value) => present.includes(value)),
      ...present.filter((value) => !declared.includes(value)).sort((a, b) => a.localeCompare(b)),
    ];

    for (const sliceValue of order) {
      const rows: ChartRow[] = [];
      for (const entity of kept) {
        const observation = observations.get(
          observationKey(entity.id, facetDimension.key, sliceValue),
        );
        if (!observation) {
          missing += 1;
          continue;
        }
        rows.push(makeRow(entity, observation, { key: sliceValue, label: sliceValue }));
      }
      facets.push({
        key: sliceValue,
        label: sliceValue,
        rows: orderRows(rows, sort, base.measure.better),
        records: max(rows, (row) => row.n) ?? 0,
      });
    }
  } else if (facetMode === 'entity' && facetDimension) {
    // Group arms by one of their own dimensions. Every facet still reads each
    // arm's own `overall` observation — grouping is not pooling.
    const declared = facetDimension.values ?? [];
    const present = [...new Set(kept.flatMap((entity) => dimensionValues(entity, facetDimension)))];
    const order = [
      ...declared.filter((value) => present.includes(value)),
      ...present.filter((value) => !declared.includes(value)).sort((a, b) => a.localeCompare(b)),
    ];

    for (const facetValue of order) {
      const members = kept.filter((entity) =>
        dimensionValues(entity, facetDimension).includes(facetValue),
      );
      const rows: ChartRow[] = [];
      for (const entity of members) {
        const observation = observations.get(observationKey(entity.id, 'overall', 'all'));
        if (!observation) {
          missing += 1;
          continue;
        }
        rows.push(makeRow(entity, observation, { key: facetValue, label: facetValue }));
      }
      facets.push({
        key: facetValue,
        label: facetValue,
        rows: orderRows(rows, sort, base.measure.better),
        records: max(rows, (row) => row.n) ?? 0,
      });
    }
  } else {
    const rows: ChartRow[] = [];
    for (const entity of kept) {
      const observation = observations.get(observationKey(entity.id, 'overall', 'all'));
      if (!observation) {
        missing += 1;
        continue;
      }
      rows.push(makeRow(entity, observation, { key: '', label: '' }));
    }
    facets.push({
      key: '',
      label: '',
      rows: orderRows(rows, sort, base.measure.better),
      records: max(rows, (row) => row.n) ?? 0,
    });
  }

  const rows = facets.flatMap((facet) => facet.rows);
  return {
    ...base,
    facets,
    rows,
    tableRows: rows.map((row) => ({
      entityId: row.entityId,
      label: row.label,
      slice: row.slice,
      sliceValue: row.facetKey || 'all',
      value: row.value,
      ciLow: row.ciLow,
      ciHigh: row.ciHigh,
      n: row.n,
      runs: row.runs,
    })),
    domain: computeDomain(rows, type, measure),
    missing,
    empty: rows.length === 0,
  };
}

/** Entity dimensions that actually vary, so the filter bar is not six identical chips. */
export function usableFilterDimensions(dataset: Dataset): Dimension[] {
  return entityDimensions(dataset).filter((dimension) => {
    if (dimension.key === 'entity') return false;
    return new Set(dataset.entities.flatMap((entity) => dimensionValues(entity, dimension))).size > 1;
  });
}
