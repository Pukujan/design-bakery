/**
 * Build-time rendering — the same component, without a browser.
 *
 * `scripts/research-validate-charts.mjs` bundles this file with esbuild, imports
 * it in Node and writes one SVG per theme. Because it goes through the same
 * `computeChartModel` and the same `ResearchChartSvg` as the interactive chart,
 * the static figure cannot disagree with the live one; the only difference is
 * that colours are resolved to literals instead of `var(--rc-*)`, since an SVG
 * opened through `<img>` has no page to inherit from.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import type { Dataset } from './types.generated';
import { computeChartModel } from './compute';
import { ResearchChartSvg, ResearchChartSvgTable } from './ResearchChartSvg';
import { CHART_COLORS, type ChartTheme } from './theme';
import { formatCount } from './format';
import type { ChartSpec } from './spec';

/**
 * The build step needs to validate fences with the same rules the page uses.
 * Re-exported here so it only has to bundle one entry point, and so there is
 * exactly one definition of "a valid chart spec".
 */
export { chartSlug, canonicalSpec, parseChartSpec, validateChartSpec } from './spec';

export interface StaticRenderOptions {
  theme: ChartTheme;
  /** Layout width in px. Text is not scaled, so this is the display width. */
  width?: number;
}

export interface StaticRenderResult {
  svg: string;
  width: number;
  height: number;
  /** One line for the manifest, so a reader can see what was rendered. */
  summary: string;
}

const DEFAULT_WIDTH = 720;

function betterLabel(better: string): string {
  if (better === 'lower') return 'lower is better';
  if (better === 'higher') return 'higher is better';
  return '';
}

export function renderResearchChartSvg(
  dataset: Dataset,
  spec: ChartSpec,
  options: StaticRenderOptions,
): StaticRenderResult {
  const model = computeChartModel(dataset, spec);
  const colors = CHART_COLORS[options.theme];
  const width = options.width ?? DEFAULT_WIDTH;

  const subtitleParts = [
    model.measure.label,
    model.measure.unit === 'fraction' ? '' : `(${model.measure.unit})`,
    betterLabel(model.measure.better),
    `${formatCount(model.entityCount)} of ${formatCount(model.totalEntityCount)} arms`,
    model.level === 'breakdown' ? 'shared scale across slices' : '',
  ].filter(Boolean);

  const sourceNote = [
    dataset.provenance?.summary ?? dataset.datasetId,
    dataset.provenance?.commit ? `commit ${dataset.provenance.commit.slice(0, 12)}` : '',
    dataset.provenance?.policy?.interval ?? '',
  ]
    .filter(Boolean)
    .join(' · ');

  const markup =
    model.level === 'table'
      ? renderToStaticMarkup(
          <ResearchChartSvgTable
            model={model}
            colors={colors}
            width={width}
            chrome="standalone"
            title={dataset.title}
            sourceNote={sourceNote}
          />,
        )
      : renderToStaticMarkup(
          <ResearchChartSvg
            model={model}
            colors={colors}
            colorMode={options.theme}
            width={width}
            chrome="standalone"
            title={dataset.title}
            subtitle={subtitleParts.join(' · ')}
            sourceNote={sourceNote}
            highlight={spec.highlight ?? []}
          />,
        );

  const heightMatch = /height="(\d+(?:\.\d+)?)"/.exec(markup);
  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`,
    width,
    height: heightMatch ? Number(heightMatch[1]) : 0,
    summary: `${model.measure.label} · level ${model.level} · ${model.rows.length || model.tableRows.length} rows`,
  };
}
