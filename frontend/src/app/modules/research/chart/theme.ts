/**
 * Chart colour tokens.
 *
 * One token set, two ways to spend it:
 *
 *  - the interactive chart asks for `css`, so every mark is filled with
 *    `var(--rc-*)` and the site's `.dark` class switches the whole chart with
 *    no re-render and no JS theme object;
 *  - the build-time static SVG asks for `light` or `dark`, because an SVG
 *    loaded through `<img>` cannot see the page's CSS variables or its fonts.
 *
 * `globals.css` declares the same `--rc-*` values. They are duplicated here on
 * purpose — a static SVG has to carry literal colours — and
 * `scripts/test-research-charts.mjs` parses the stylesheet and fails if the two
 * ever disagree, so the duplication cannot rot.
 */
import type { ChartType } from './spec';

export type ChartTheme = 'light' | 'dark';
export type ChartColorMode = ChartTheme | 'css';

/** Series slots. A `colorBy` dimension's values take these in sorted order. */
export const SERIES_SLOTS = 6;

export interface ChartColors {
  surface: string;
  ink: string;
  muted: string;
  grid: string;
  axis: string;
  band: string;
  accent: string;
  series: string[];
}

const LIGHT: ChartColors = {
  surface: '#ffffff',
  ink: '#1a1a1a',
  muted: '#5a5a5a',
  grid: '#e3dfd4',
  axis: '#b6b0a1',
  band: '#f1eee6',
  accent: '#1a4a8a',
  series: ['#1a4a8a', '#b4531a', '#4a7a1a', '#7a1a6a', '#1a7a7a', '#8a6a1a'],
};

const DARK: ChartColors = {
  surface: '#181b23',
  ink: '#e8e6df',
  muted: '#9a968c',
  grid: '#2c3040',
  axis: '#4a5060',
  band: '#20242e',
  accent: '#7eb0e8',
  series: ['#7eb0e8', '#e8a06a', '#9ecf6a', '#d98cc8', '#6ad4d4', '#dcc36a'],
};

const CSS_VARS = [
  '--rc-surface',
  '--rc-ink',
  '--rc-muted',
  '--rc-grid',
  '--rc-axis',
  '--rc-band',
  '--rc-accent',
];

const CSS: ChartColors = {
  surface: 'var(--rc-surface)',
  ink: 'var(--rc-ink)',
  muted: 'var(--rc-muted)',
  grid: 'var(--rc-grid)',
  axis: 'var(--rc-axis)',
  band: 'var(--rc-band)',
  accent: 'var(--rc-accent)',
  series: Array.from({ length: SERIES_SLOTS }, (_, index) => `var(--rc-cat-${index + 1})`),
};

export const CHART_COLORS: Record<ChartColorMode, ChartColors> = {
  light: LIGHT,
  dark: DARK,
  css: CSS,
};

/** Non-highlighted rows are dimmed; dark mode needs less of it to stay legible. */
export const DIM_OPACITY: Record<ChartTheme, number> = { light: 0.42, dark: 0.55 };

/** The literal values `globals.css` must declare, for the drift test. */
export const CSS_TOKEN_SOURCE: Record<ChartTheme, Record<string, string>> = {
  light: {
    '--rc-surface': LIGHT.surface,
    '--rc-ink': LIGHT.ink,
    '--rc-muted': LIGHT.muted,
    '--rc-grid': LIGHT.grid,
    '--rc-axis': LIGHT.axis,
    '--rc-band': LIGHT.band,
    '--rc-accent': LIGHT.accent,
    '--rc-dim': String(DIM_OPACITY.light),
    ...Object.fromEntries(LIGHT.series.map((value, index) => [`--rc-cat-${index + 1}`, value])),
  },
  dark: {
    '--rc-surface': DARK.surface,
    '--rc-ink': DARK.ink,
    '--rc-muted': DARK.muted,
    '--rc-grid': DARK.grid,
    '--rc-axis': DARK.axis,
    '--rc-band': DARK.band,
    '--rc-accent': DARK.accent,
    '--rc-dim': String(DIM_OPACITY.dark),
    ...Object.fromEntries(DARK.series.map((value, index) => [`--rc-cat-${index + 1}`, value])),
  },
};

export { CSS_VARS };

/** Non-highlighted rows are dimmed; dark mode needs less of it to stay legible. */
export const DIM_OPACITY: Record<ChartTheme, number> = { light: 0.42, dark: 0.55 };

/**
 * Dim level for a colour mode. On the page this is a CSS variable so the
 * `.dark` class can raise it without re-rendering the chart; the static build
 * bakes in the number.
 */
export function dimOpacity(mode: ChartColorMode): number | string {
  return mode === 'css' ? 'var(--rc-dim)' : DIM_OPACITY[mode];
}

/** Font stack for standalone SVGs, which cannot reach the page's webfonts. */
export const SVG_FONT_STACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface ChartLayout {
  /** `horizontal` = label left of the bar; `stacked` = label above it. */
  mode: 'horizontal' | 'stacked';
  width: number;
  labelWidth: number;
  plotLeft: number;
  plotRight: number;
  rowHeight: number;
  facetHeaderHeight: number;
  axisHeight: number;
  headerHeight: number;
  footerHeight: number;
}

export const CHART_TYPE_LABEL: Record<ChartType, string> = {
  'dot-ci': 'Dot with 95% interval',
  bar: 'Bar with 95% interval',
};
