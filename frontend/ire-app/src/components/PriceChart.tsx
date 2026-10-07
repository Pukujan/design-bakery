import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { SectionPanel } from "@/components/SectionPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { AXIS_TICK, CHART, MONO_STACK } from "@/lib/chart-theme";
import { shorten, type PickRow } from "@/lib/feed";
import { formatPrice, formatUsd } from "@/lib/format";

interface PriceDatum {
  name: string;
  short: string;
  rank: number;
  vendor: string | null;
  route: string;
  recommended: boolean;
  input: number | null;
  output: number | null;
}

interface PriceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: PriceDatum }>;
}

function PriceTooltip({ active, payload }: PriceTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="max-w-[240px] rounded-md border border-line-strong bg-surface px-3 py-2 shadow-sm">
      <p className="font-display text-[13px] font-semibold leading-snug text-ink">
        {row.name}
      </p>
      {row.vendor ? (
        <p className="font-mono text-[10.5px] text-ink-muted">{row.vendor}</p>
      ) : null}
      <dl className="mt-1.5 space-y-0.5 font-mono text-[11px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">input / 1M</dt>
          <dd className="text-ink">{formatUsd(row.input)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">output / 1M</dt>
          <dd className="text-ink">{formatUsd(row.output)}</dd>
        </div>
      </dl>
      <p className="mt-1.5 truncate border-t border-line pt-1.5 font-mono text-[10.5px] text-ink">
        {row.route}
      </p>
      <p
        className={
          row.recommended
            ? "mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-forest"
            : "mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-oxide"
        }
      >
        {row.recommended ? "Recommended" : "Held back"}
      </p>
    </div>
  );
}

interface NameTickProps {
  x?: number;
  y?: number;
  payload?: { value?: string };
}

interface PriceChartProps {
  rows: PickRow[];
  tierLabel: string;
}

/** Section 3 — input and output ask per model, held-back rows faded. */
export function PriceChart({ rows, tierLabel }: PriceChartProps) {
  const isMobile = useIsMobile();

  const data: PriceDatum[] = rows.map((row) => ({
    name: row.model,
    short: shorten(row.model, isMobile ? 14 : 22),
    rank: row.rank,
    vendor: row.vendor,
    route: row.route,
    recommended: row.recommended,
    input: row.inputPrice,
    output: row.outputPrice,
  }));

  // Keep axis labels unique so the tick lookup below is exact.
  const seen = new Map<string, number>();
  for (const datum of data) {
    const count = seen.get(datum.short) ?? 0;
    seen.set(datum.short, count + 1);
    if (count > 0) datum.short = `${datum.short} #${datum.rank}`;
  }

  const heldBack = new Map(data.map((datum) => [datum.short, !datum.recommended]));
  const height = Math.max(280, data.length * 34 + 84);

  const renderNameTick = (props: NameTickProps) => {
    const value = props.payload?.value ?? "";
    return (
      <text
        x={props.x}
        y={props.y}
        dy={4}
        textAnchor="end"
        fontSize={isMobile ? 10 : 11}
        fontFamily={MONO_STACK}
        fill={heldBack.get(value) ? CHART.faint : CHART.ink}
      >
        {value}
      </text>
    );
  };

  return (
    <div data-testid="price-chart">
      <SectionPanel
        index="01"
        title="What each model asks"
        eyebrow={`${tierLabel} · USD per 1M tokens, input and output`}
        meta={
          <span className="font-mono text-[11px]">
            {data.length} {data.length === 1 ? "row" : "rows"}
          </span>
        }
      >
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-paper px-6 py-14 text-center">
            <BarChart3 className="h-5 w-5 text-ink-muted" aria-hidden />
            <p className="font-display text-sm font-medium text-ink">
              No rows to chart in this tier
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
              The feed carried no open-weight entries for {tierLabel.toLowerCase()} right
              now, so there is nothing to price.
            </p>
          </div>
        ) : (
          <>
            <div className="-mx-1" style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 4, right: 18, bottom: 36, left: 4 }}
                  barGap={2}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke={CHART.line}
                    strokeDasharray="2 4"
                  />
                  <XAxis
                    type="number"
                    stroke={CHART.line}
                    tick={AXIS_TICK}
                    tickFormatter={(value: number) => formatPrice(value)}
                    label={{
                      value: "USD per 1M tokens",
                      position: "insideBottom",
                      offset: -24,
                      fontSize: 11,
                      fontFamily: MONO_STACK,
                      fill: CHART.muted,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="short"
                    width={isMobile ? 98 : 152}
                    stroke={CHART.line}
                    tick={renderNameTick}
                    tickMargin={6}
                  />
                  <Tooltip content={<PriceTooltip />} cursor={{ fill: CHART.cursor }} />
                  <Bar dataKey="input" name="Input" barSize={9} radius={[0, 2, 2, 0]}>
                    {data.map((datum, index) => (
                      <Cell
                        key={`in-${index}`}
                        fill={datum.recommended ? CHART.forest : CHART.forestFaded}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="output" name="Output" barSize={9} radius={[0, 2, 2, 0]}>
                    {data.map((datum, index) => (
                      <Cell
                        key={`out-${index}`}
                        fill={datum.recommended ? CHART.oxide : CHART.oxideFaded}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-4 rounded-[2px] bg-forest" />
                Input
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-4 rounded-[2px] bg-oxide" />
                Output
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-4 rounded-[2px] bg-forest" />
                Solid = recommended
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-4 rounded-[2px] bg-forest opacity-35"
                />
                Faded = held back by a policy rule
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Each figure is the lowest listed ask when the list was built; the provider may
              bill more. Rows with no listed price chart as empty bars and read{" "}
              <span className="font-mono">n/a</span> in the table.
            </p>
          </>
        )}
      </SectionPanel>
    </div>
  );
}
