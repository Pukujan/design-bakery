import { HealthBadge } from "@/components/HealthBadge";
import { LicenceCell } from "@/components/LicenceCell";
import { ModelCell } from "@/components/ModelCell";
import { RouteChip } from "@/components/RouteChip";
import { Verdict } from "@/components/Verdict";
import type { PickRow } from "@/lib/feed";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PicksCardsProps {
  rows: PickRow[];
}

/** Narrow-screen rendering of the same rows the table shows. */
export function PicksCards({ rows }: PicksCardsProps) {
  return (
    <ul className="space-y-3 lg:hidden">
      {rows.map((row) => (
        <li
          key={row.id}
          className={cn(
            "rounded-md border border-line bg-surface p-3",
            !row.recommended && "bg-paper/70",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="num text-[10.5px] text-ink-muted">#{row.rank}</span>
              <ModelCell row={row} muted={!row.recommended} className="mt-0.5" />
              {row.vendor ? (
                <p className="mt-1 font-mono text-[10.5px] text-ink-muted">
                  {row.vendor}
                </p>
              ) : null}
            </div>
            <HealthBadge
              status={row.healthStatus}
              confidence={row.healthConfidence}
              reasons={row.healthReasons}
            />
          </div>

          <div className="mt-2.5">
            <RouteChip route={row.route} />
          </div>

          <dl className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line pt-2.5 font-mono text-[11px]">
            <div>
              <dt className="text-ink-muted">input / 1M</dt>
              <dd className="mt-0.5 tabular-nums text-ink">
                {formatUsd(row.inputPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">output / 1M</dt>
              <dd className="mt-0.5 tabular-nums text-ink">
                {formatUsd(row.outputPrice)}
              </dd>
            </div>
          </dl>

          <div className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
            <LicenceCell row={row} />
            <Verdict row={row} />
          </div>
        </li>
      ))}
    </ul>
  );
}
