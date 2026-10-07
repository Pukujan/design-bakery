import { Images } from "lucide-react";
import { HealthBadge } from "@/components/HealthBadge";
import { LicenceCell } from "@/components/LicenceCell";
import { RouteChip } from "@/components/RouteChip";
import { SectionPanel } from "@/components/SectionPanel";
import { Verdict } from "@/components/Verdict";
import type { PickRow, Tier } from "@/lib/feed";
import { formatLocalDateTime, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UtilitySectionProps {
  tier: Tier;
}

function kindLabel(kind: string | null): string {
  return (kind ?? "utility").replace(/_/g, " ");
}

function UtilityCard({ row }: { row: PickRow }) {
  const verified = row.openWeight === true;

  return (
    <article
      className={cn(
        "flex flex-col rounded-md border border-line bg-surface p-3.5",
        !verified && "border-oxide/30 bg-paper/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="num text-[10.5px] text-ink-muted">#{row.rank}</span>
          <h3 className="mt-0.5 font-display text-sm font-semibold leading-snug text-ink">
            {row.model}
          </h3>
          {row.vendor ? (
            <p className="mt-0.5 font-mono text-[10.5px] text-ink-muted">{row.vendor}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] capitalize",
            verified
              ? "border-forest/35 bg-forest/10 text-forest"
              : "border-oxide/35 bg-oxide/10 text-oxide",
          )}
        >
          {kindLabel(row.utilityKind)}
        </span>
      </div>

      <div className="mt-2.5">
        <RouteChip route={row.route} />
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line pt-2.5 font-mono text-[11px]">
        <div>
          <dt className="text-ink-muted">input / 1M</dt>
          <dd className="mt-0.5 tabular-nums text-ink">{formatUsd(row.inputPrice)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">output / 1M</dt>
          <dd className="mt-0.5 tabular-nums text-ink">{formatUsd(row.outputPrice)}</dd>
        </div>
      </dl>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <LicenceCell row={row} />
        <HealthBadge
          status={row.healthStatus}
          confidence={row.healthConfidence}
          reasons={row.healthReasons}
        />
      </div>

      <div className="mt-2">
        <Verdict row={row} />
      </div>
    </article>
  );
}

/** Section 7 — the optional image / multimodal list and its open-weight verdicts. */
export function UtilitySection({ tier }: UtilitySectionProps) {
  const rows = [...tier.entries].sort((a, b) => {
    const kindA = kindLabel(a.utilityKind);
    const kindB = kindLabel(b.utilityKind);
    if (kindA !== kindB) return kindA.localeCompare(kindB);
    return a.rank - b.rank;
  });

  const verified = rows.filter((row) => row.openWeight === true).length;
  const unverified = rows.length - verified;

  const kindCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const label = kindLabel(row.utilityKind);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const kinds = Object.keys(kindCounts).sort((a, b) => a.localeCompare(b));

  return (
    <div data-testid="utility-section">
      <SectionPanel
        index="05"
        title="Image and multimodal"
        eyebrow={`Non-text utilities · source list ${tier.list} · as of ${formatLocalDateTime(tier.asOf)}`}
        meta={
          <span className="font-mono text-[11px]">
            {verified} verified · {unverified} unverified
          </span>
        }
      >
        <div className="space-y-4">
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            These rows generate or transform something other than plain text. Each one
            carries its own open-weight verdict: either a verified licence with published
            weights, or listed with an unverified licence. Unverified rows are never
            recommended, and they never link a licence.
          </p>

          {tier.description ? (
            <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs leading-relaxed text-ink-muted">
              {tier.description}
            </p>
          ) : null}

          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong bg-paper px-6 py-12 text-center">
              <Images className="h-5 w-5 text-ink-muted" aria-hidden />
              <p className="font-display text-sm font-medium text-ink">
                No utility rows survived the open-weight filter
              </p>
              <p className="max-w-md text-xs leading-relaxed text-ink-muted">
                The feed carried a utility list, but every row in it was marked as not
                open-weight.
              </p>
            </div>
          ) : (
            <>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-y border-line py-2.5">
                {kinds.map((kind) => (
                  <li
                    key={kind}
                    className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-muted"
                  >
                    <span className="capitalize">{kind}</span>
                    <span className="num text-ink">{kindCounts[kind]}</span>
                  </li>
                ))}
              </ul>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((row) => (
                  <UtilityCard key={row.id} row={row} />
                ))}
              </div>
            </>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
