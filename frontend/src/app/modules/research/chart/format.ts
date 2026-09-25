/**
 * Number and CSV formatting.
 *
 * `d3-format` reads the measure's own `format` string from the dataset, so the
 * chart prints a number the same way the exporter's figure and the paper table
 * do. Nothing here decides precision on its own.
 */
import { format as d3Format } from 'd3-format';
import type { Measure } from './types.generated';

const FALLBACK_FORMAT = ',.3~g';

/** A measure's `format` is a d3-format specifier; a bad one must not blank the chart. */
export function measureFormatter(measure: Measure | undefined): (value: number) => string {
  const specifier = measure?.format || FALLBACK_FORMAT;
  try {
    return d3Format(specifier);
  } catch {
    return d3Format(FALLBACK_FORMAT);
  }
}

export const EMPTY = '—';

export function formatValue(measure: Measure | undefined, value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  return measureFormatter(measure)(value);
}

/** Axis ticks: the same specifier, but compact enough to sit under a tick. */
export function axisFormatter(measure: Measure | undefined): (value: number) => string {
  if (measure?.unit === 'fraction') {
    const digits = measure.format.includes('.1%') ? 0 : 1;
    return d3Format(`.${digits}%`);
  }
  const specifier = measure?.format || FALLBACK_FORMAT;
  try {
    const base = d3Format(specifier);
    return (value: number) => {
      const rendered = base(value);
      return rendered.length > 9 ? d3Format('.3~s')(value) : rendered;
    };
  } catch {
    return d3Format('.3~s');
  }
}

export function formatInterval(
  measure: Measure | undefined,
  low: number | null | undefined,
  high: number | null | undefined,
): string {
  if (low === null || low === undefined || high === null || high === undefined) return '';
  const formatter = measureFormatter(measure);
  return `${formatter(low)}–${formatter(high)}`;
}

export function formatCount(value: number): string {
  return d3Format(',')(value);
}

/** RFC 4180: quote when the field carries a comma, a quote or a newline. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [header.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  // Trailing newline so `cat` and diff tools treat it as a text file.
  return `${lines.join('\n')}\n`;
}

/**
 * CSV for whatever the reader is looking at.
 *
 * One row per arm per slice per metric — the same granularity the dataset
 * ships. It is a re-export of published aggregates, never a new statistic, so
 * it cannot leak anything the dataset file does not already contain. The
 * `run_paths` column carries the hashed prediction files behind each row, which
 * is provenance, not content: paths and hashes only.
 */
export function buildCsv(options: {
  datasetId: string;
  metric: string;
  measure: Measure | undefined;
  level: string;
  rows: {
    entity: string;
    label: string;
    slice: string;
    sliceValue: string;
    value: number | null;
    ciLow: number | null;
    ciHigh: number | null;
    n: number;
    runs?: { path: string }[];
  }[];
}): string {
  const header = [
    'entity',
    'label',
    'slice',
    'slice_value',
    'metric',
    'value',
    'ci_low',
    'ci_high',
    'n',
    'run_paths',
    'dataset',
    'level',
  ];
  const rows = options.rows.map((row) => [
    row.entity,
    row.label,
    row.slice,
    row.sliceValue,
    options.metric,
    row.value,
    row.ciLow,
    row.ciHigh,
    row.n,
    (row.runs ?? []).map((run) => run.path).join('; '),
    options.datasetId,
    options.level,
  ]);
  return toCsv(header, rows);
}

/** `eval-lab/judges-blind-760` + metric → a safe download file name. */
export function csvFileName(datasetId: string, metric: string, level: string): string {
  const slug = `${datasetId}-${metric}-${level}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'research-chart'}.csv`;
}
