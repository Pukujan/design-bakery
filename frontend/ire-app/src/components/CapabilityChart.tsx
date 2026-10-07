import type { ReactNode } from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScatterChart as ScatterIcon } from "lucide-react";
import { SectionPanel } from "@/components/SectionPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { AXIS_TICK, CHART, MONO_STACK } from "@/lib/chart-theme";
import { shorten, type PickRow, type TierKey } from "@/lib/feed";
import { formatPrice, formatUsd } from "@/lib/format";

interface CapabilityDatum {
  name: string;
  short: string;
  rank: number;
  vendor: string | null;
  route: string;
  recommended: boolean;
  capability: number;
  blended: number;
  capabilityTier: string | null;
}

interface CapabilityTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: CapabilityDatum }>;
}

function CapabilityTooltip({ active, payload }: CapabilityTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="max-w-[250px] rounded-md border border-line-strong bg-surface px-3 py-2 shadow-sm">
      <p className="font-display text-[13px] font-semibold leading-snug text-ink">
        {point.name}
      </p>
      {point.vendor ? (
        <p className="font-mono text-[10.5px] text-ink-muted">{point.vendor}</p>
      ) : null}
      <dl className="mt-1.5 space-y-0.5 font-mono text-[11px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">capability</dt>
          <dd className="text-ink">≈ {Math.round(point.capability)} / 100</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">blended / 1M</dt>
          <dd className="text-ink">{formatUsd(point.blended)}</dd>
        </div>
        {point.capabilityTier ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">band</dt>
            <dd className="text-ink">{point.capabilityTier}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-1.5 truncate border-t border-line pt-1.5 font-mono text-[10.5px] text-ink">
        {point.route}
      </p>
      <p
        className={
          point.recommended
            ? "mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-forest"
            : "mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-oxide"
        }
      >
        {point.recommended ? "Recommended" : "Held back"}
      </p>
    </div>
  );
}

function PointShape(props: { cx?: number; cy?: number; payload?: CapabilityDatum }) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return <g />;
  const fill = payload.recommended ? CHART.forest : CHART.oxide;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.recommended ? 5.5 : 5}
      fill={fill}
      fillOpacity={payload.recommended ? 0.92 : 0.4}
      stroke={fill}
      strokeWidth={1.25}
    />
  );
}

interface CapabilityChartProps {
  rows: PickRow[];
  tierKey: TierKey;
  tierLabel: string;
}

/** Section 4 — capability prior against blended ask. Text tiers only. */
export function CapabilityChart({ rows, tierKey, tierLabel }: CapabilityChartProps) {
  const isMobile = useIsMobile();

  // Skipped entirely for the utility tier and when fewer than two rows carry a score.
  if (tierKey === "utility") return null;

  const scored = rows.filter((row) => row.capability !== null);
  if (scored.length < 2) return null;

  const data: CapabilityDatum[] = scored
    .filter((row) => row.blendedPrice !== null && (row.blendedPrice ?? 0) > 0)
    .map((row) => ({
      name: row.model,
      short: shorten(row.model, isMobile ? 11 : 20),
      rank: row.rank,
      vendor: row.vendor,
      route: row.route,
      recommended: row.recommended,
      capability: row.capability as number,
      blended: row.blendedPrice as number,
      capabilityTier: row.capabilityTier,
    }))
    .sort((a, b) => a.blended - b.blended);

  const prices = data.map((point) => point.blended);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const logScale = minPrice > 0 && maxPrice / minPrice > 3;
  const xDomain: [number, number] = [
    minPrice === maxPrice ? minPrice / 2 : minPrice * 0.72,
    minPrice === maxPrice ? maxPrice * 2 : maxPrice * 1.5,
  ];
  const rightMargin = isMobile ? 74 : 118;

  let body: ReactNode;

  if (data.length === 0) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-paper px-6 py-14 text-center">
        <ScatterIcon className="h-5 w-5 text-ink-muted" aria-hidden />
        <p className="font-display text-sm font-medium text-ink">Nothing to plot</p>
        <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
          Every scored row in this tier is missing a usable price, so capability cannot be
          charted against cost.
        </p>
      </div>
    );
  } else {
    body = (
      <>
        <div className="-mx-1" style={{ height: isMobile ? 330 : 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: rightMargin, bottom: 42, left: 4 }}>
              <CartesianGrid stroke={CHART.line} strokeDasharray="2 4" />
              <XAxis
                dataKey="blended"
                name="Blended price"
                type="number"
                scale={logScale ? "log" : "auto"}
                domain={xDomain}
                allowDataOverflow
                stroke={CHART.line}
                tick={AXIS_TICK}
                tickFormatter={(value: number) => formatPrice(value)}
                label={{
                  value: `Blended ask, USD per 1M tokens${logScale ? " (log scale)" : ""}`,
                  position: "insideBottom",
                  offset: -30,
                  fontSize: 11,
                  fontFamily: MONO_STACK,
                  fill: CHART.muted,
                }}
              />
              <YAxis
                dataKey="capability"
                name="Capability"
                type="number"
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                width={isMobile ? 34 : 44}
                stroke={CHART.line}
                tick={AXIS_TICK}
                label={{
                  value: "Capability score",
                  angle: -90,
                  position: "insideLeft",
                  offset: 12,
                  fontSize: 11,
                  fontFamily: MONO_STACK,
                  fill: CHART.muted,
                }}
              />
              <Tooltip
                content={<CapabilityTooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: CHART.line }}
              />
              <Scatter
                data={data}
                shape={<PointShape />}
                isAnimationActive={false}
                label={{
                  dataKey: "short",
                  position: "right",
                  offset: 8,
                  fontSize: isMobile ? 9 : 10.5,
                  fontFamily: MONO_STACK,
                  fill: CHART.muted,
                }}
              >
                {data.map((point, index) => (
                  <Cell
                    key={`${index}-${point.rank}`}
                    fill={point.recommended ? CHART.forest : CHART.oxide}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-forest" />
            Recommended
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-oxide opacity-45" />
            Held back by a policy rule
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Capability scores are low-confidence priors, not precise measurements — read the
          ordering as indicative, not as a ranking you can trust to a decimal. Blended ask is
          input plus output per 1M tokens.
          {logScale ? " The price axis is logarithmic." : ""}
        </p>
      </>
    );
  }

  return (
    <div data-testid="capability-chart">
      <SectionPanel
        index="02"
        title="Capability against price"
        eyebrow={`${tierLabel} · capability prior (0–100) against blended ask per 1M tokens`}
        meta={
          <span className="font-mono text-[11px]">
            {data.length} scored {data.length === 1 ? "row" : "rows"}
          </span>
        }
      >
        {body}
      </SectionPanel>
    </div>
  );
}
