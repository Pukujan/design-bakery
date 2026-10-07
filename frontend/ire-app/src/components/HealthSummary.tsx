import { Activity } from "lucide-react";
import { SectionPanel } from "@/components/SectionPanel";
import type { PickRow } from "@/lib/feed";
import { HEALTH_META, summarizeHealth } from "@/lib/health";
import { cn } from "@/lib/utils";

interface HealthSummaryProps {
  rows: PickRow[];
  tierLabel: string;
}

/** Section 5 — how much of the visible list is actually usable right now. */
export function HealthSummary({ rows, tierLabel }: HealthSummaryProps) {
  const summary = summarizeHealth(rows);
  const present = summary.counts.filter((entry) => entry.count > 0);

  return (
    <div data-testid="health-summary">
      <SectionPanel
        index="03"
        title="Route health across the list"
        eyebrow={`${tierLabel} · probe status per row when the list was built`}
        meta={
          <span className="font-mono text-[11px]">
            {summary.routable}/{summary.total} answering
          </span>
        }
      >
        {summary.total === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong bg-paper px-6 py-10 text-center">
            <Activity className="h-5 w-5 text-ink-muted" aria-hidden />
            <p className="text-xs leading-relaxed text-ink-muted">
              No rows in this tier, so there is no health to summarise.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div
                className="flex h-3 w-full overflow-hidden rounded-sm border border-line bg-paper"
                role="img"
                aria-label={`Route health: ${present
                  .map((entry) => `${entry.count} ${entry.label.toLowerCase()}`)
                  .join(", ")}`}
              >
                {summary.counts.map((entry) =>
                  entry.count > 0 ? (
                    <span
                      key={entry.key}
                      className={cn("h-full", HEALTH_META[entry.key].barClass)}
                      style={{ width: `${entry.share * 100}%` }}
                      title={`${entry.label}: ${entry.count}`}
                    />
                  ) : null,
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                <span className="font-mono text-ink">{summary.routable}</span> of{" "}
                <span className="font-mono text-ink">{summary.total}</span> rows are
                answering (healthy or degraded);{" "}
                <span className="font-mono text-ink">{summary.unusable}</span> are failing
                or unavailable.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
              {summary.counts.map((entry) => {
                const meta = HEALTH_META[entry.key];
                const empty = entry.count === 0;
                return (
                  <div
                    key={entry.key}
                    className={cn("bg-surface px-3 py-3", empty && "bg-paper/60")}
                  >
                    <dt className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={cn("h-2 w-2 shrink-0 rounded-full", meta.dotClass)}
                      />
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">
                        {meta.label}
                      </span>
                    </dt>
                    <dd
                      className={cn(
                        "mt-1.5 font-display text-2xl font-semibold leading-none tabular-nums",
                        empty ? "text-ink-muted/60" : "text-ink",
                      )}
                    >
                      {entry.count}
                    </dd>
                    <dd className="mt-1 font-mono text-[10.5px] text-ink-muted">
                      {summary.total > 0
                        ? `${Math.round(entry.share * 100)}% of list`
                        : "—"}
                    </dd>
                    <dd className="mt-1 text-[11px] leading-snug text-ink-muted">
                      {meta.note}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {present.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px] text-ink-muted">
                {present.map((entry) => (
                  <li key={entry.key} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 rounded-full",
                        HEALTH_META[entry.key].dotClass,
                      )}
                    />
                    <span className="font-mono uppercase tracking-[0.08em]">
                      {entry.label}
                    </span>
                    <span className="num text-ink">{entry.count}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
