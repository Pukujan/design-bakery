/**
 * The interactive research chart.
 *
 * Loaded through `React.lazy` from `ResearchChartEmbed`, so none of this —
 * nor d3, nor the chart spec code — reaches the main bundle. The page shows a
 * build-time SVG until this arrives and keeps it if this never does.
 *
 * It owns the reader's state (metric, level, filters, sort, active row) and
 * renders it as plain React SVG. There is no charting library and no imperative
 * DOM: every mark is a React element, so the same tree can be rendered to a
 * string in Node by `renderResearchChartSvg` and the two cannot disagree.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dataset } from './types.generated';
import {
  CHART_LEVELS,
  CHART_TYPES,
  DEFAULT_CONTROLS,
  dimensionValues,
  entityDimensions,
  filterOptions,
  resolveSpec,
  type ChartControl,
  type ChartLevel,
  type ChartSort,
  type ChartSpec,
  type ChartType,
} from './spec';
import { computeChartModel, usableFilterDimensions, type ChartModel, type ChartRow } from './compute';
import { ResearchChartSvg, layoutFor, type ChartAnchor } from './ResearchChartSvg';
import { CHART_COLORS, CHART_TYPE_LABEL, type ChartColors } from './theme';
import { buildCsv, csvFileName, formatCount, formatInterval, formatValue } from './format';

export interface ResearchChartProps {
  dataset: Dataset;
  spec: ChartSpec;
  mode?: 'embed' | 'explorer';
  /** Fires once the interactive chart is on screen, so the static SVG can retire. */
  onReady?: () => void;
}

const LEVEL_LABEL: Record<ChartLevel, string> = {
  summary: 'Summary',
  breakdown: 'Breakdown',
  runs: 'Runs',
  table: 'Table',
};

const SORT_LABEL: Record<ChartSort, string> = {
  value: 'By value',
  label: 'By name',
  none: 'Export order',
};

interface ActiveRow {
  row: ChartRow;
  anchor?: ChartAnchor;
}

export default function ResearchChart({
  dataset,
  spec,
  mode = 'embed',
  onReady,
}: ResearchChartProps) {
  const resolved = useMemo(() => resolveSpec(spec, dataset), [spec, dataset]);
  const colors: ChartColors = CHART_COLORS.css;

  const [metric, setMetric] = useState(resolved.metric);
  const [level, setLevel] = useState<ChartLevel>(resolved.level);
  const [type, setType] = useState<ChartType>(resolved.type);
  const [sort, setSort] = useState<ChartSort>(resolved.sort);
  const [filters, setFilters] = useState<Record<string, string[]>>(resolved.filters);
  const [active, setActive] = useState<ActiveRow | null>(null);
  const [showTable, setShowTable] = useState(resolved.level === 'table');
  const [width, setWidth] = useState(mode === 'explorer' ? 900 : 720);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Measured, not assumed: the layout switch at 560px depends on real pixels.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const measure = () => setWidth(Math.max(280, Math.round(node.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const model = useMemo(
    () =>
      computeChartModel(dataset, spec, {
        metric,
        level,
        type,
        sort,
        filters,
        entities: resolved.entities,
        highlight: resolved.highlight,
        facet: resolved.facet,
        colorBy: resolved.colorBy,
      }),
    [dataset, spec, metric, level, type, sort, filters, resolved],
  );

  const controls: ChartControl[] | false = resolved.controls;
  const has = (control: ChartControl) =>
    controls !== false && (controls.length === 0 ? DEFAULT_CONTROLS : controls).includes(control);

  const filterDimensions = useMemo(() => usableFilterDimensions(dataset), [dataset]);
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((values) => values && values.length > 0).length,
    [filters],
  );

  const toggleFilter = useCallback((key: string, value: string) => {
    setFilters((current) => {
      const values = current[key] ?? [];
      const next = values.includes(value)
        ? values.filter((entry) => entry !== value)
        : [...values, value];
      const updated = { ...current, [key]: next };
      if (next.length === 0) delete updated[key];
      return updated;
    });
    setActive(null);
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const downloadCsv = useCallback(() => {
    const csv = buildCsv({
      datasetId: dataset.datasetId,
      metric: model.measure.key,
      measure: model.measure,
      level: model.level,
      rows: model.tableRows.map((row) => ({
        entity: row.entityId,
        label: row.label,
        slice: row.slice,
        sliceValue: row.sliceValue,
        value: row.value,
        ciLow: row.ciLow,
        ciHigh: row.ciHigh,
        n: row.n,
      })),
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = csvFileName(dataset.datasetId, model.measure.key, model.level);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [dataset.datasetId, model]);

  const layout = useMemo(() => layoutFor(model, width, 'inline', resolved.height), [
    model,
    width,
    resolved.height,
  ]);

  // A tooltip anchored to a row that just disappeared is worse than no tooltip.
  useEffect(() => {
    if (active && !model.rows.some((row) => row.id === active.row.id)) setActive(null);
  }, [active, model.rows]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!node.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const onActivate = useCallback((row: ChartRow | null, anchor?: ChartAnchor) => {
    setActive(row ? { row, anchor } : null);
  }, []);

  const subtitle = useMemo(() => {
    const unit = model.measure.unit === 'fraction' ? '' : ` (${model.measure.unit})`;
    const better =
      model.measure.better === 'lower'
        ? 'Lower is better'
        : model.measure.better === 'higher'
          ? 'Higher is better'
          : '';
    const shown =
      model.level === 'table'
        ? `${formatCount(model.tableRows.length)} rows`
        : `${model.entityCount} of ${model.totalEntityCount} arms`;
    return [model.measure.label + unit, better, shown].filter(Boolean).join(' · ');
  }, [model]);

  return (
    <figure
      className="rc-chart not-prose"
      data-level={model.level}
      data-metric={model.measure.key}
      ref={containerRef}
    >
      <div className="rc-chart__head">
        <p className="rc-chart__title">{dataset.title}</p>
        <p className="rc-chart__subtitle">{subtitle}</p>
        {model.measure.definition ? (
          <p className="rc-chart__definition">{model.measure.definition}</p>
        ) : null}
      </div>

      {controls !== false ? (
        <div className="rc-chart__toolbar" role="group" aria-label="Chart controls">
          {has('metric') && dataset.measures.length > 1 ? (
            <div className="rc-chart__control" role="group" aria-label="Metric">
              <span className="rc-chart__control-label">Metric</span>
              <div className="rc-chart__chips">
                {dataset.measures.map((measure) => (
                  <button
                    key={measure.key}
                    type="button"
                    className="rc-chip"
                    aria-pressed={measure.key === model.measure.key}
                    onClick={() => {
                      setMetric(measure.key);
                      setActive(null);
                    }}
                  >
                    {measure.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {has('level') ? (
            <div className="rc-chart__control" role="group" aria-label="Detail level">
              <span className="rc-chart__control-label">Detail</span>
              <div className="rc-chart__chips">
                {CHART_LEVELS.filter((entry) =>
                  dataset.levels.length === 0 ? true : dataset.levels.some((item) => item.key === entry),
                ).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className="rc-chip"
                    aria-pressed={entry === model.level}
                    onClick={() => {
                      setLevel(entry);
                      setShowTable(entry === 'table');
                      setActive(null);
                    }}
                  >
                    {LEVEL_LABEL[entry]}
                  </button>
                ))}
                {CHART_TYPES.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className="rc-chip rc-chip--shape"
                    aria-pressed={entry === model.type}
                    title={CHART_TYPE_LABEL[entry]}
                    onClick={() => setType(entry)}
                  >
                    {entry === 'bar' ? 'Bars' : 'Dots'}
                  </button>
                ))}
                <button
                  type="button"
                  className="rc-chip rc-chip--shape"
                  aria-pressed={sort === 'value'}
                  title="Sort by value, best first"
                  onClick={() => setSort(sort === 'value' ? 'label' : 'value')}
                >
                  {SORT_LABEL[sort]}
                </button>
              </div>
            </div>
          ) : null}

          {has('filters') && filterDimensions.length > 0 ? (
            <details className="rc-chart__filters">
              <summary className="rc-chart__filters-summary">
                Filters
                {activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ''}
              </summary>
              <div className="rc-chart__filters-body">
                {filterDimensions.map((dimension) => (
                  <div key={dimension.key} className="rc-chart__control">
                    <span className="rc-chart__control-label">{dimension.label}</span>
                    <div className="rc-chart__chips">
                      {filterOptions(dataset, dimension).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className="rc-chip"
                          aria-pressed={(filters[dimension.key] ?? []).includes(value)}
                          onClick={() => toggleFilter(dimension.key, value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {activeFilterCount > 0 ? (
                  <button type="button" className="rc-chip rc-chip--ghost" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            </details>
          ) : null}

          {has('download') ? (
            <div className="rc-chart__actions">
              <button type="button" className="rc-chip rc-chip--ghost" onClick={downloadCsv}>
                Download CSV
              </button>
              <a
                className="rc-chip rc-chip--ghost"
                href={`/research/data/${dataset.datasetId.replace(/^.*\//, '')}.json`}
                download
              >
                Download JSON
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {model.level === 'table' ? (
        <p className="rc-chart__note">
          {formatCount(model.tableRows.length)} published rows — one per arm, slice and metric. The
          dataset publishes no finer granularity.
        </p>
      ) : model.empty ? (
        <p className="rc-chart__note">No observations match the current filters.</p>
      ) : (
        <div className="rc-chart__plot">
          <ResearchChartSvg
            model={model}
            colors={colors}
            colorMode="css"
            width={width}
            height={resolved.height}
            interactive
            activeId={active?.row.id ?? null}
            highlight={resolved.highlight}
            onActivate={onActivate}
            svgRef={svgRef}
          />
          {active ? (
            <div
              className="rc-tooltip"
              aria-hidden="true"
              style={{
                left: `${active.anchor?.x ?? layout.plotLeft}px`,
                top: `${active.anchor?.y ?? 0}px`,
                transform: 'translate(-50%, calc(-100% - 10px))',
              }}
            >
              <p className="rc-tooltip__title">{active.row.label}</p>
              <p className="rc-tooltip__value">
                {formatValue(model.measure, active.row.value)}
                {active.row.ciLow !== null && active.row.ciHigh !== null ? (
                  <span className="rc-tooltip__ci">
                    {' '}
                    95% CI {formatInterval(model.measure, active.row.ciLow, active.row.ciHigh)}
                  </span>
                ) : null}
              </p>
              <p className="rc-tooltip__meta">
                {active.row.facetKey ? `${active.row.facetLabel} · ` : ''}
                {formatCount(active.row.n)} {model.measure.n}
              </p>
              {entityDimensions(dataset)
                .filter((dimension) => dimension.key !== 'entity')
                .slice(0, 4)
                .map((dimension) => {
                  const values = dimensionValues(active.row.entity, dimension);
                  if (values.length === 0) return null;
                  return (
                    <p key={dimension.key} className="rc-tooltip__meta">
                      {dimension.label}: {values.join(', ')}
                    </p>
                  );
                })}
            </div>
          ) : null}
        </div>
      )}

      {model.level !== 'table' && !model.empty ? (
        <details
          className="rc-chart__table"
          open={showTable}
          onToggle={(event) => setShowTable((event.target as HTMLDetailsElement).open)}
        >
          <summary className="rc-chart__table-summary">Data table</summary>
          <div className="rc-table-scroll">
            <table className="rc-table">
              <caption className="rc-table__caption">
                {dataset.title} — {model.measure.label}, one row per arm and slice.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Arm</th>
                  {model.level === 'breakdown' ? <th scope="col">Slice</th> : null}
                  <th scope="col" className="rc-table__num">
                    {model.measure.label}
                  </th>
                  <th scope="col" className="rc-table__num">
                    95% interval
                  </th>
                  <th scope="col" className="rc-table__num">
                    {model.measure.n}
                  </th>
                </tr>
              </thead>
              <tbody>
                {model.rows.map((row) => (
                  <tr key={row.id} className={row.id === active?.row.id ? 'rc-table__row--active' : undefined}>
                    <th scope="row">{row.label}</th>
                    {model.level === 'breakdown' ? <td>{row.facetLabel}</td> : null}
                    <td className="rc-table__num">{formatValue(model.measure, row.value)}</td>
                    <td className="rc-table__num">
                      {formatInterval(model.measure, row.ciLow, row.ciHigh) || '—'}
                    </td>
                    <td className="rc-table__num">{formatCount(row.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      {model.missing > 0 ? (
        <p className="rc-chart__note">
          {formatCount(model.missing)} arm/slice combination(s) have no published observation and are
          left out rather than filled in.
        </p>
      ) : null}

      <figcaption className="rc-chart__caption">
        {resolved.caption ? <span>{resolved.caption} </span> : null}
        <span className="rc-chart__provenance">
          {dataset.provenance?.summary ?? dataset.datasetId}
          {dataset.provenance?.commit ? ` · ${dataset.provenance.commit.slice(0, 7)}` : ''}
          {` · ${formatCount(model.entityCount)} arms shown of ${formatCount(model.totalEntityCount)}.`}
        </span>
      </figcaption>
    </figure>
  );
}
