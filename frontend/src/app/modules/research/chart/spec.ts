/**
 * The ```chart fence spec — the only thing an author writes.
 *
 * It is deliberately small and data-agnostic: it names a dataset and a metric,
 * says how much detail to show, and never carries numbers. Every value the
 * chart draws comes from the dataset file, so a chart in a paper cannot drift
 * from the export it cites, and nothing here can be used to publish a figure
 * the exporter did not produce.
 *
 * This module is shared verbatim by the browser component, the build-time
 * validator and the static SVG renderer, so a spec means exactly one thing.
 */
import type { Dataset, Dimension, Entity, Measure } from './types.generated';

export type ChartType = 'dot-ci' | 'bar';
/**
 * Detail levels, matching the `levels` a dataset declares. `breakdown` facets
 * over a *slice* dimension (mode, task source); `experiments` facets over an
 * *entity* dimension (experiment); `runs` is every arm with the prediction
 * files behind it. Nothing here can reach finer than one row per arm per slice.
 */
export type ChartLevel = 'summary' | 'breakdown' | 'experiments' | 'runs' | 'table';
export type ChartControl = 'metric' | 'level' | 'filters' | 'download';
export type ChartSort = 'value' | 'label' | 'none';

export const CHART_TYPES: ChartType[] = ['dot-ci', 'bar'];
export const CHART_LEVELS: ChartLevel[] = ['summary', 'breakdown', 'experiments', 'runs', 'table'];
export const CHART_CONTROLS: ChartControl[] = ['metric', 'level', 'filters', 'download'];
export const CHART_SORTS: ChartSort[] = ['value', 'label', 'none'];

export const DEFAULT_LEVEL: ChartLevel = 'summary';
export const DEFAULT_TYPE: ChartType = 'dot-ci';
export const DEFAULT_CONTROLS: ChartControl[] = ['metric', 'level', 'filters', 'download'];

/** Below this the chart stacks the label above the bar and never rotates text. */
export const STACKED_BREAKPOINT = 560;

export interface ChartSpec {
  /** Dataset id, e.g. `eval-lab/judges-blind-760`. Resolved through index.json. */
  data: string;
  /** `dot-ci` (default) or `bar`. Both draw the same 95% interval. */
  type?: ChartType;
  /** Measure key from the dataset's `measures`. */
  metric: string;
  /** How much of the dataset to show. Default `summary`. */
  level?: ChartLevel;
  /** Facet dimension key: a slice dimension for `breakdown`, an entity dimension for `experiments`. */
  facet?: string;
  /** Initial entity-dimension filters, e.g. `{"deployment": ["local"]}`. */
  filters?: Record<string, string[]>;
  /** Explicit entity ids. Overrides the level's default entity set. */
  entities?: string[];
  /** Entity ids to call out; the rest are dimmed. */
  highlight?: string[];
  /** Entity dimension key the colour is keyed on. Default `deployment` when it exists. */
  colorBy?: string;
  sort?: ChartSort;
  /** Which controls the reader gets. `false` hides the whole toolbar. */
  controls?: ChartControl[] | false;
  caption?: string;
  /** Plot height in px. Omit to let the row count decide. */
  height?: number;
}

export interface SpecParseResult {
  spec?: ChartSpec;
  error?: string;
}

/**
 * Read a fenced ```chart body. JSON, not YAML: it avoids a new dependency and
 * the bodies are short. A parse failure is reported, never thrown, so the paper
 * page can show the author what is wrong instead of blanking the article.
 */
export function parseChartSpec(text: string): SpecParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { error: `chart spec is not valid JSON: ${(error as Error).message}` };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'chart spec must be a JSON object' };
  }

  const candidate = parsed as Record<string, unknown>;
  const problems: string[] = [];
  if (typeof candidate.data !== 'string' || candidate.data.trim() === '') {
    problems.push('`data` is required and must be a dataset id');
  }
  if (typeof candidate.metric !== 'string' || candidate.metric.trim() === '') {
    problems.push('`metric` is required and must be a measure key');
  }
  if (candidate.type !== undefined && !CHART_TYPES.includes(candidate.type as ChartType)) {
    problems.push(`\`type\` must be one of ${CHART_TYPES.join(', ')}`);
  }
  if (candidate.level !== undefined && !CHART_LEVELS.includes(candidate.level as ChartLevel)) {
    problems.push(`\`level\` must be one of ${CHART_LEVELS.join(', ')}`);
  }
  if (candidate.sort !== undefined && !CHART_SORTS.includes(candidate.sort as ChartSort)) {
    problems.push(`\`sort\` must be one of ${CHART_SORTS.join(', ')}`);
  }
  if (candidate.controls !== undefined && candidate.controls !== false) {
    if (!Array.isArray(candidate.controls)) {
      problems.push('`controls` must be false or an array of control names');
    } else {
      for (const control of candidate.controls) {
        if (!CHART_CONTROLS.includes(control as ChartControl)) {
          problems.push(`unknown control \`${String(control)}\``);
        }
      }
    }
  }
  if (problems.length > 0) return { error: problems.join('; ') };
  return { spec: candidate as unknown as ChartSpec };
}

/** Spec with every default filled in, so downstream code never re-derives them. */
export function resolveSpec(spec: ChartSpec, dataset?: Dataset): Required<Omit<ChartSpec, 'controls' | 'height' | 'caption'>> & {
  controls: ChartControl[] | false;
  height?: number;
  caption?: string;
} {
  return {
    data: spec.data,
    type: spec.type ?? DEFAULT_TYPE,
    metric: spec.metric,
    level: spec.level ?? DEFAULT_LEVEL,
    facet: spec.facet ?? defaultFacetKey(dataset, spec.level ?? DEFAULT_LEVEL) ?? '',
    filters: spec.filters ?? {},
    entities: spec.entities ?? [],
    highlight: spec.highlight ?? [],
    colorBy: spec.colorBy ?? defaultColorByKey(dataset) ?? '',
    sort: spec.sort ?? 'value',
    controls: spec.controls ?? DEFAULT_CONTROLS,
    height: spec.height,
    caption: spec.caption,
  };
}

/**
 * The dimension a level facets on when the author did not name one:
 * a slice dimension for `breakdown`, the experiment dimension for
 * `experiments`. Returns undefined for levels that do not facet.
 */
export function defaultFacetKey(dataset: Dataset | undefined, level?: ChartLevel): string | undefined {
  if (!dataset) return undefined;
  if (level === 'experiments') {
    const candidates = entityDimensions(dataset);
    return (
      candidates.find((dimension) => dimension.key === 'experiment')?.key ??
      candidates.find((dimension) => (dimension.field ?? '').includes('experiment'))?.key
    );
  }
  return sliceDimensions(dataset)[0]?.key;
}

/** Facet dimensions must be slice-scoped for `breakdown` and entity-scoped for `experiments`. */
export function facetScopeFor(level: ChartLevel): 'slice' | 'entity' | undefined {
  if (level === 'breakdown') return 'slice';
  if (level === 'experiments') return 'entity';
  return undefined;
}

export function defaultColorByKey(dataset?: Dataset): string | undefined {
  const dimensions = dataset?.dimensions.filter((dimension) => dimension.scope === 'entity') ?? [];
  return (
    dimensions.find((dimension) => dimension.key === 'deployment')?.key ?? dimensions[0]?.key
  );
}

/** Entity dimensions are filters; slice dimensions are facets. */
export function entityDimensions(dataset: Dataset): Dimension[] {
  return dataset.dimensions.filter((dimension) => dimension.scope === 'entity');
}

export function sliceDimensions(dataset: Dataset): Dimension[] {
  return dataset.dimensions.filter((dimension) => dimension.scope === 'slice');
}

/**
 * Read a dimension's value for one entity. `field` is a dot path into the
 * entity (`settings.thinking`), and an array field matches if it contains the
 * value (`experimentIds`).
 */
export function dimensionValues(entity: Entity, dimension: Dimension): string[] {
  const field = dimension.field ?? dimension.key;
  let cursor: unknown = entity;
  for (const segment of field.split('.')) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') return [];
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (Array.isArray(cursor)) return cursor.map((entry) => String(entry));
  if (cursor === null || cursor === undefined) return [];
  return [String(cursor)];
}

/** Filter values offered for a dimension, from the declared list or the data. */
export function filterOptions(dataset: Dataset, dimension: Dimension): string[] {
  if (dimension.values && dimension.values.length > 0) return dimension.values;
  const seen = new Set<string>();
  for (const entity of dataset.entities) {
    for (const value of dimensionValues(entity, dimension)) seen.add(value);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

export function measureByKey(dataset: Dataset, key: string): Measure | undefined {
  return dataset.measures.find((measure) => measure.key === key);
}

export function dimensionByKey(dataset: Dataset, key: string): Dimension | undefined {
  return dataset.dimensions.find((dimension) => dimension.key === key);
}

export function entityById(dataset: Dataset, id: string): Entity | undefined {
  return dataset.entities.find((entity) => entity.id === id);
}

/**
 * Everything that can be wrong with a spec, as human-readable sentences.
 *
 * The build-time validator turns a non-empty list into a failed build; the
 * paper page shows the same list instead of a broken chart. Both call this, so
 * there is exactly one definition of "valid".
 */
export function validateChartSpec(dataset: Dataset, spec: ChartSpec): string[] {
  const problems: string[] = [];

  if (dataset.kind !== 'dataset') {
    problems.push(`dataset ${dataset.datasetId} is a \`${dataset.kind}\` file, not a dataset`);
    return problems;
  }
  if (spec.data !== dataset.datasetId) {
    problems.push(`spec asks for dataset "${spec.data}" but the file declares "${dataset.datasetId}"`);
  }

  const measure = measureByKey(dataset, spec.metric);
  if (!measure) {
    problems.push(
      `unknown metric "${spec.metric}"; dataset has ${dataset.measures.map((entry) => entry.key).join(', ')}`,
    );
  }

  const level = spec.level ?? DEFAULT_LEVEL;
  if (!CHART_LEVELS.includes(level)) {
    problems.push(`unknown level "${level}"`);
  } else if (dataset.levels.length > 0 && !dataset.levels.some((entry) => entry.key === level)) {
    problems.push(
      `dataset does not offer level "${level}"; it offers ${dataset.levels
        .map((entry) => entry.key)
        .join(', ')}`,
    );
  }

  const wantedFacetScope = facetScopeFor(level);
  if (wantedFacetScope) {
    const facetKey = spec.facet ?? defaultFacetKey(dataset, level);
    if (!facetKey) {
      problems.push(`level "${level}" needs a ${wantedFacetScope} dimension, and the dataset has none`);
    } else {
      const facet = dimensionByKey(dataset, facetKey);
      if (!facet) {
        problems.push(`unknown facet "${facetKey}"`);
      } else if (facet.scope !== wantedFacetScope) {
        problems.push(
          `level "${level}" facets on a ${wantedFacetScope} dimension, but "${facetKey}" is ${facet.scope}-scoped`,
        );
      }
    }
  } else if (spec.facet !== undefined) {
    const facet = dimensionByKey(dataset, spec.facet);
    if (!facet) problems.push(`unknown facet "${spec.facet}"`);
    else if (facet.scope === 'slice') {
      problems.push(
        `facet "${spec.facet}" is a slice dimension; only level "breakdown" facets over slices`,
      );
    }
  }

  for (const [key, values] of Object.entries(spec.filters ?? {})) {
    const dimension = dimensionByKey(dataset, key);
    if (!dimension) {
      problems.push(`unknown filter dimension "${key}"`);
      continue;
    }
    if (dimension.scope !== 'entity') {
      problems.push(`filter dimension "${key}" is a slice dimension; only entity dimensions filter`);
      continue;
    }
    const allowed = new Set(filterOptions(dataset, dimension));
    for (const value of values) {
      if (!allowed.has(value)) {
        problems.push(
          `filter "${key}" has value "${value}"; allowed values are ${[...allowed].join(', ')}`,
        );
      }
    }
  }

  for (const [label, ids] of [
    ['entities', spec.entities ?? []],
    ['highlight', spec.highlight ?? []],
  ] as const) {
    for (const id of ids) {
      if (!entityById(dataset, id)) problems.push(`unknown ${label} id "${id}"`);
    }
  }

  if (spec.colorBy !== undefined) {
    const dimension = dimensionByKey(dataset, spec.colorBy);
    if (!dimension) problems.push(`unknown colorBy dimension "${spec.colorBy}"`);
    else if (dimension.scope !== 'entity') {
      problems.push(`colorBy dimension "${spec.colorBy}" is a slice dimension; use an entity dimension`);
    }
  }

  return problems;
}

/** Stable stringify: object keys sorted, so the slug is independent of author order. */
export function canonicalSpec(spec: ChartSpec): string {
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(spec).sort()) {
    const value = (spec as Record<string, unknown>)[key];
    if (value === undefined) continue;
    ordered[key] = value;
  }
  return JSON.stringify(ordered);
}

/** 32-bit FNV-1a. Small, dependency-free, and identical in Node and the browser. */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function slugPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * File-name-safe id for a chart, derived only from the spec.
 *
 * Node and the browser must agree without talking to each other, so this is a
 * pure function of the canonical spec: no counters, no build state. Two
 * different specs in one paper can only collide on a 32-bit hash, and the
 * build-time validator fails if they ever do.
 */
export function chartSlug(spec: ChartSpec): string {
  // Only dataset-independent fields are allowed in the readable part; the hash
  // covers everything, so the name stays stable wherever it is computed.
  const parts = [
    spec.type ?? DEFAULT_TYPE,
    spec.level ?? DEFAULT_LEVEL,
    slugPart(spec.metric ?? ''),
  ].filter(Boolean);
  return `${parts.join('-')}-${fnv1a(canonicalSpec(spec))}`;
}
