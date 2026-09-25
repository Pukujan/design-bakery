/**
 * The chart itself: pure SVG, one component, two colour modes.
 *
 * `colors` comes from `theme.ts` and is either literal hexes (`light`/`dark`,
 * used by the build-time static SVG) or `var(--rc-*)` references (`css`, used
 * on the page so the `.dark` class switches the chart with no re-render). Every
 * mark reads from `colors`, so the static and interactive charts are the same
 * code path and cannot drift apart.
 *
 * Text is drawn with a system font stack rather than the page's webfonts: an
 * SVG opened through `<img>`, or printed, has no access to the page's CSS, and
 * a chart whose labels reflow differently in the fallback is a chart nobody can
 * trust. Labels are never rotated; below `STACKED_BREAKPOINT` the row stacks
 * the label above the bar instead.
 */
import { useMemo, useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import { formatCount, formatInterval, formatValue, measureFormatter } from './format';
import { STACKED_BREAKPOINT } from './spec';
import type { ChartFacet, ChartModel, ChartRow } from './compute';
import { dimOpacity, SVG_FONT_STACK, type ChartColorMode, type ChartColors } from './theme';

const PAD_TOP = 6;
const PAD_BOTTOM = 4;
const PAD_LEFT = 10;
const PAD_RIGHT = 12;

const FONT_LABEL = 11.5;
const FONT_VALUE = 11;
const FONT_AXIS = 10.5;
const FONT_FACET = 11;
const FONT_TITLE = 13;
const FONT_SUBTITLE = 11;

/** Rough advance width for the system sans stack at a given size. */
function textWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.545;
}

function truncate(text: string, maxWidth: number, fontSize: number): string {
  if (maxWidth <= 0) return '';
  if (textWidth(text, fontSize) <= maxWidth) return text;
  const perChar = fontSize * 0.545;
  const room = Math.max(1, Math.floor(maxWidth / perChar) - 1);
  return room <= 1 ? '…' : `${text.slice(0, room)}…`;
}

export interface ChartAnchor {
  x: number;
  y: number;
}

export interface ChartSvgProps {
  model: ChartModel;
  colors: ChartColors;
  /** Which token set `colors` came from — decides how dimming is expressed. */
  colorMode: ChartColorMode;
  width: number;
  /** Omit to let the row count decide. */
  height?: number;
  /** `standalone` draws its own title/source line, for `<img>` and print. */
  chrome?: 'inline' | 'standalone';
  title?: string;
  subtitle?: string;
  sourceNote?: string;
  caption?: string;
  /** Adds focus, keyboard and pointer affordances. Off for the static build. */
  interactive?: boolean;
  activeId?: string | null;
  highlight?: string[];
  onActivate?: (row: ChartRow | null, anchor?: ChartAnchor) => void;
  svgRef?: React.Ref<SVGSVGElement>;
  ariaLabel?: string;
}

interface PlacedRow {
  row: ChartRow;
  y: number;
  facetIndex: number;
}

export interface ChartLayout {
  mode: 'horizontal' | 'stacked';
  width: number;
  height: number;
  labelWidth: number;
  plotLeft: number;
  plotRight: number;
  rowHeight: number;
  facetHeaderHeight: number;
  axisHeight: number;
  headerHeight: number;
  footerHeight: number;
}

/** Rows-per-facet geometry. Exported so the interactive shell can mirror it. */
export function layoutFor(
  model: ChartModel,
  width: number,
  chrome: 'inline' | 'standalone',
  height?: number,
): ChartLayout {
  const mode = width < STACKED_BREAKPOINT ? 'stacked' : 'horizontal';
  const labelWidth =
    mode === 'stacked' ? width - PAD_LEFT - PAD_RIGHT : Math.min(190, Math.max(88, width * 0.26));
  const rowHeight = mode === 'stacked' ? 42 : 24;
  const facetHeaderHeight = model.facets.length > 1 ? 22 : 0;
  const axisHeight = 26;
  const headerHeight = chrome === 'standalone' ? 28 : 0;
  const footerHeight = chrome === 'standalone' ? 16 : 0;

  const rowCount = model.facets.reduce((total, facet) => total + facet.rows.length, 0);
  const natural =
    PAD_TOP +
    PAD_BOTTOM +
    headerHeight +
    footerHeight +
    axisHeight +
    rowCount * rowHeight +
    model.facets.length * facetHeaderHeight;

  return {
    mode,
    width,
    height: Math.max(height ?? natural, 80),
    labelWidth,
    plotLeft: mode === 'stacked' ? PAD_LEFT : labelWidth + PAD_LEFT + 8,
    plotRight: width - PAD_RIGHT,
    rowHeight,
    facetHeaderHeight,
    axisHeight,
    headerHeight,
    footerHeight,
  };
}

/** Place every row and facet, and total up the height actually needed. */
function place(model: ChartModel, layout: ChartLayout) {
  const placed: PlacedRow[] = [];
  const facetTops: { facet: ChartFacet; index: number; top: number; bottom: number }[] = [];
  let cursor = PAD_TOP + layout.headerHeight;

  model.facets.forEach((facet, index) => {
    const top = cursor;
    cursor += layout.facetHeaderHeight;
    for (const row of facet.rows) {
      placed.push({ row, y: cursor, facetIndex: index });
      cursor += layout.rowHeight;
    }
    facetTops.push({ facet, index, top, bottom: cursor });
  });

  const plotTop = PAD_TOP + layout.headerHeight;
  const plotBottom = cursor;
  const axisY = plotBottom + layout.axisHeight - 8;
  return { placed, facetTops, plotTop, plotBottom, axisY };
}

function rowAriaLabel(row: ChartRow, model: ChartModel): string {
  const measure = model.measure;
  const value = formatValue(measure, row.value);
  const interval = formatInterval(measure, row.ciLow, row.ciHigh);
  const parts = [row.facetKey ? `${row.label}, ${row.facetLabel}` : row.label, value];
  if (interval) parts.push(`95% interval ${interval}`);
  parts.push(`${formatCount(row.n)} ${measure.n}`);
  return parts.join('. ');
}

export function ResearchChartSvg(props: ChartSvgProps) {
  const {
    model,
    colors,
    colorMode,
    width,
    height,
    chrome = 'inline',
    title,
    subtitle,
    sourceNote,
    interactive = false,
    activeId = null,
    highlight = [],
    onActivate,
    svgRef,
    ariaLabel,
  } = props;

  const layout = useMemo(() => layoutFor(model, width, chrome, height), [model, width, chrome, height]);
  const { placed, facetTops, plotTop, plotBottom, axisY } = useMemo(
    () => place(model, layout),
    [model, layout],
  );

  const nodeRefs = useRef(new Map<string, SVGGElement>());

  const x = useMemo(
    () =>
      scaleLinear()
        .domain(model.domain)
        .range([layout.plotLeft, Math.max(layout.plotLeft + 1, layout.plotRight)]),
    [model.domain, layout.plotLeft, layout.plotRight],
  );

  const ticks = useMemo(() => {
    const span = layout.plotRight - layout.plotLeft;
    const count = Math.max(3, Math.min(8, Math.round(span / 78)));
    return x.ticks(count).filter((tick) => tick >= model.domain[0] && tick <= model.domain[1]);
  }, [x, layout.plotRight, layout.plotLeft, model.domain]);

  const axisTick = useMemo(() => measureFormatter(model.measure), [model.measure]);
  const highlighted = useMemo(() => new Set(highlight), [highlight]);
  const dimmed = highlighted.size > 0;
  const opacityFor = (row: ChartRow): number | string =>
    dimmed && !highlighted.has(row.entityId) ? dimOpacity(colorMode) : 1;

  const showFacetHeaders = model.facets.length > 1;
  const barZero = model.type === 'bar' ? x(Math.max(model.domain[0], 0)) : 0;

  function focusRow(id: string, delta: number) {
    const index = placed.findIndex((entry) => entry.row.id === id);
    if (index === -1) return;
    const next = placed[(index + delta + placed.length) % placed.length];
    nodeRefs.current.get(next.row.id)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGGElement>, row: ChartRow) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      focusRow(row.id, 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      focusRow(row.id, -1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      nodeRefs.current.get(placed[0]?.row.id ?? '')?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      nodeRefs.current.get(placed[placed.length - 1]?.row.id ?? '')?.focus();
    } else if (event.key === 'Escape') {
      onActivate?.(null);
    }
  }

  const anchorFor = (row: ChartRow, y: number): ChartAnchor => {
    const low = x(Math.min(row.ciLow ?? row.value ?? model.domain[0], row.value ?? model.domain[1]));
    const high = x(Math.max(row.ciHigh ?? row.value ?? model.domain[0], row.value ?? model.domain[1]));
    return {
      x: Math.max(layout.plotLeft, Math.min(layout.plotRight, (low + high) / 2)),
      y: y + layout.rowHeight / 2,
    };
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      className="rc-svg"
      width={width}
      height={layout.height}
      viewBox={`0 0 ${width} ${layout.height}`}
      role="group"
      aria-label={ariaLabel ?? `${title ?? 'Chart'}: ${model.measure.label}`}
      style={{ display: 'block', fontFamily: SVG_FONT_STACK }}
    >
      <rect x={0} y={0} width={width} height={layout.height} fill={colors.surface} />

      {chrome === 'standalone' ? (
        <g>
          <text x={PAD_LEFT} y={PAD_TOP + 12} fontSize={FONT_TITLE} fontWeight={600} fill={colors.ink}>
            {title ?? model.measure.label}
          </text>
          <text x={PAD_LEFT} y={PAD_TOP + 28} fontSize={FONT_SUBTITLE} fill={colors.muted}>
            {subtitle ?? ''}
          </text>
        </g>
      ) : null}

      {/* Grid: drawn once behind every facet so the shared x-scale is visible. */}
      <g aria-hidden="true">
        {ticks.map((tick) => (
          <line
            key={`grid-${tick}`}
            x1={x(tick)}
            x2={x(tick)}
            y1={plotTop}
            y2={plotBottom}
            stroke={colors.grid}
            strokeWidth={1}
          />
        ))}
      </g>

      {facetTops.map(({ facet, index, top, bottom }) => (
        <g key={`facet-${facet.key || index}`}>
          {showFacetHeaders ? (
            <text
              x={layout.mode === 'stacked' ? PAD_LEFT : layout.plotLeft}
              y={top + 14}
              fontSize={FONT_FACET}
              fontWeight={600}
              fill={colors.ink}
            >
              {truncate(
                `${facet.label}${facet.records ? ` · ${formatCount(facet.records)} ${model.measure.n}` : ''}`,
                layout.plotRight - layout.plotLeft,
                FONT_FACET,
              )}
            </text>
          ) : null}
          <line
            x1={layout.mode === 'stacked' ? PAD_LEFT : layout.plotLeft - 6}
            x2={layout.plotRight}
            y1={bottom - 1}
            y2={bottom - 1}
            stroke={colors.grid}
            strokeWidth={1}
          />
        </g>
      ))}

      {placed.map(({ row, y }) => {
        const isActive = activeId === row.id;
        const value = row.value;
        const color = seriesColorFor(model, row, colors);
        const rowMid = y + layout.rowHeight / 2;
        const labelY = layout.mode === 'stacked' ? y + 13 : rowMid + 4;
        const plotY = layout.mode === 'stacked' ? y + 26 : rowMid;
        const barHeight = layout.mode === 'stacked' ? 12 : 11;
        const hasInterval = row.ciLow !== null && row.ciHigh !== null;
        const valueText = formatValue(model.measure, value);
        const valueX = value === null ? layout.plotLeft : x(value);
        const barStart = barZero;
        const barEnd = valueX;
        const barWidth = Math.abs(barEnd - barStart);
        const insideBar = model.type === 'bar' && barWidth > 52;
        const labelText =
          layout.mode === 'stacked' ? row.label : row.shortLabel || row.label;

        return (
          <g
            key={row.id}
            ref={(node) => {
              if (node) nodeRefs.current.set(row.id, node);
              else nodeRefs.current.delete(row.id);
            }}
            className={interactive ? 'rc-row' : undefined}
            data-row-id={row.id}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'img' : undefined}
            aria-label={interactive ? rowAriaLabel(row, model) : undefined}
            style={{ opacity: opacityFor(row), cursor: interactive ? 'pointer' : undefined }}
            onMouseEnter={
              interactive ? () => onActivate?.(row, anchorFor(row, y)) : undefined
            }
            onMouseLeave={interactive ? () => onActivate?.(null) : undefined}
            onFocus={interactive ? () => onActivate?.(row, anchorFor(row, y)) : undefined}
            onBlur={interactive ? () => onActivate?.(null) : undefined}
            onClick={
              interactive
                ? (event) => {
                    event.stopPropagation();
                    onActivate?.(isActive ? null : row, anchorFor(row, y));
                  }
                : undefined
            }
            onKeyDown={interactive ? (event) => handleKeyDown(event, row) : undefined}
          >
            {!interactive && labelText !== row.label ? <title>{row.label}</title> : null}
            {isActive ? (
              <rect
                x={0}
                y={y}
                width={width}
                height={layout.rowHeight}
                fill={colors.band}
                rx={3}
              />
            ) : null}

            <text
              x={layout.mode === 'stacked' ? PAD_LEFT : layout.plotLeft - 8}
              y={labelY}
              fontSize={FONT_LABEL}
              textAnchor={layout.mode === 'stacked' ? 'start' : 'end'}
              fill={colors.ink}
            >
              {truncate(labelText, layout.labelWidth, FONT_LABEL)}
            </text>

            {model.type === 'bar' ? (
              <rect
                x={Math.min(barStart, barEnd)}
                y={plotY - barHeight / 2}
                width={Math.max(1, barWidth)}
                height={barHeight}
                rx={2}
                fill={color}
              />
            ) : null}

            {hasInterval ? (
              <g stroke={model.type === 'bar' ? colors.ink : color} strokeWidth={1.5}>
                <line x1={x(row.ciLow as number)} x2={x(row.ciHigh as number)} y1={plotY} y2={plotY} />
                <line
                  x1={x(row.ciLow as number)}
                  x2={x(row.ciLow as number)}
                  y1={plotY - 4}
                  y2={plotY + 4}
                />
                <line
                  x1={x(row.ciHigh as number)}
                  x2={x(row.ciHigh as number)}
                  y1={plotY - 4}
                  y2={plotY + 4}
                />
              </g>
            ) : null}

            {model.type === 'dot-ci' && value !== null ? (
              <circle cx={valueX} cy={plotY} r={4} fill={color} stroke={colors.surface} strokeWidth={1} />
            ) : null}

            <text
              x={insideBar ? barEnd - 6 : Math.min(layout.plotRight, Math.max(barEnd, valueX) + 7)}
              y={plotY + 4}
              fontSize={FONT_VALUE}
              textAnchor={insideBar ? 'end' : 'start'}
              fill={insideBar ? colors.surface : colors.muted}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {valueText}
            </text>
          </g>
        );
      })}

      {/* Axis */}
      <g aria-hidden="true">
        <line
          x1={layout.plotLeft}
          x2={layout.plotRight}
          y1={axisY - 10}
          y2={axisY - 10}
          stroke={colors.axis}
          strokeWidth={1}
        />
        {ticks.map((tick) => (
          <g key={`tick-${tick}`}>
            <line x1={x(tick)} x2={x(tick)} y1={axisY - 10} y2={axisY - 6} stroke={colors.axis} strokeWidth={1} />
            <text
              x={x(tick)}
              y={axisY}
              fontSize={FONT_AXIS}
              textAnchor="middle"
              fill={colors.muted}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {axisTick(tick)}
            </text>
          </g>
        ))}
      </g>

      {chrome === 'standalone' ? (
        <text x={PAD_LEFT} y={layout.height - 4} fontSize={FONT_AXIS} fill={colors.muted}>
          {truncate(
            sourceNote ?? `${model.measure.label} · ${model.measure.definition}`,
            width - PAD_LEFT - PAD_RIGHT,
            FONT_AXIS,
          )}
        </text>
      ) : null}

      {!interactive && model.empty ? (
        <text
          x={width / 2}
          y={layout.height / 2}
          fontSize={FONT_LABEL}
          textAnchor="middle"
          fill={colors.muted}
        >
          No observations for this selection
        </text>
      ) : null}
    </svg>
  );
}

/**
 * Palette slot for a row.
 *
 * Slots follow the sorted list of values, so a new arm appended to the dataset
 * does not repaint every existing one — the colours are a property of the
 * category, not of the filtered view.
 */
function seriesColorFor(model: ChartModel, row: ChartRow, colors: ChartColors): string {
  const values = model.seriesValues;
  const index = values.indexOf(row.colorValue);
  const slot = index === -1 ? values.length : index;
  return colors.series[slot % colors.series.length];
}

/** Static fallback for `level: "table"`: the same rows, as SVG text. */
export function ResearchChartSvgTable(props: {
  model: ChartModel;
  colors: ChartColors;
  width: number;
  chrome?: 'inline' | 'standalone';
  title?: string;
  sourceNote?: string;
}) {
  const { model, colors, width, chrome = 'standalone', title, sourceNote } = props;
  const headerHeight = chrome === 'standalone' ? 28 : 0;
  const rowHeight = 18;
  const limit = Math.max(1, Math.floor((640 - headerHeight) / rowHeight));
  const rows = model.tableRows.slice(0, limit);
  const overflow = model.tableRows.length - rows.length;
  const columns = ['Arm', 'Slice', 'Value', '95% CI', 'n'];
  const columnX = [PAD_LEFT, PAD_LEFT + width * 0.42, PAD_LEFT + width * 0.62, PAD_LEFT + width * 0.76, width - PAD_RIGHT];
  const height = headerHeight + (rows.length + 1) * rowHeight + 26;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title ?? 'Data table'}
      style={{ display: 'block', fontFamily: SVG_FONT_STACK }}
    >
      <rect x={0} y={0} width={width} height={height} fill={colors.surface} />
      {chrome === 'standalone' ? (
        <text x={PAD_LEFT} y={16} fontSize={FONT_TITLE} fontWeight={600} fill={colors.ink}>
          {title ?? 'Data table'}
        </text>
      ) : null}

      {columns.map((column, index) => (
        <text
          key={column}
          x={columnX[index]}
          y={headerHeight + 12}
          fontSize={FONT_AXIS}
          fontWeight={600}
          textAnchor={index >= 2 ? 'end' : 'start'}
          fill={colors.ink}
        >
          {column}
        </text>
      ))}

      {rows.map((row, index) => {
        const y = headerHeight + rowHeight * (index + 1) + 12;
        return (
          <g key={`${row.entityId}-${row.slice}-${row.sliceValue}`}>
            <text x={columnX[0]} y={y} fontSize={FONT_AXIS} fill={colors.ink}>
              {truncate(row.label, width * 0.4, FONT_AXIS)}
            </text>
            <text x={columnX[1]} y={y} fontSize={FONT_AXIS} fill={colors.muted}>
              {truncate(`${row.slice}: ${row.sliceValue}`, width * 0.18, FONT_AXIS)}
            </text>
            <text x={columnX[2]} y={y} fontSize={FONT_AXIS} textAnchor="end" fill={colors.ink}>
              {formatValue(model.measure, row.value)}
            </text>
            <text x={columnX[3]} y={y} fontSize={FONT_AXIS} textAnchor="end" fill={colors.muted}>
              {formatInterval(model.measure, row.ciLow, row.ciHigh)}
            </text>
            <text x={columnX[4]} y={y} fontSize={FONT_AXIS} textAnchor="end" fill={colors.muted}>
              {formatCount(row.n)}
            </text>
          </g>
        );
      })}

      <text x={PAD_LEFT} y={height - 6} fontSize={FONT_AXIS} fill={colors.muted}>
        {truncate(
          overflow > 0
            ? `${formatCount(overflow)} more row(s) in the interactive table · ${sourceNote ?? ''}`
            : sourceNote ?? '',
          width - PAD_LEFT - PAD_RIGHT,
          FONT_AXIS,
        )}
      </text>
    </svg>
  );
}
