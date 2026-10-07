import { AlertTriangle, CalendarDays, Clock3, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feed } from "@/lib/feed";
import { formatDay, formatLocalDateTime, isStaleNow } from "@/lib/format";

interface PicksHeroProps {
  feed: Feed;
  onRefresh: () => void;
  refreshing: boolean;
}

/** Section 1 — masthead, list day, build time and the staleness warning. */
export function PicksHero({ feed, onRefresh, refreshing }: PicksHeroProps) {
  const stale = isStaleNow(feed.staleAfter);

  const facts = [
    {
      label: "List day",
      icon: CalendarDays,
      value: formatDay(feed.dayEt),
      hint: feed.dayEt ? `day_et ${feed.dayEt} · US Eastern` : "US Eastern",
    },
    {
      label: "Built",
      icon: Clock3,
      value: formatLocalDateTime(feed.generatedAt),
      hint: "generated_at · your local time",
    },
    {
      label: "Refresh due after",
      icon: Clock3,
      value: formatLocalDateTime(feed.staleAfter),
      hint: stale ? "stale_after passed · overdue" : "stale_after · still current",
    },
  ];

  return (
    <header data-testid="picks-hero" className="space-y-3">
      {stale ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border border-oxide/40 bg-oxide/10 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-oxide" aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-display font-semibold text-oxide">
              This list is overdue for its daily refresh.
            </p>
            <p className="mt-0.5 leading-relaxed text-ink-muted">
              It should have been replaced after {formatLocalDateTime(feed.staleAfter)}.
              Prices, availability and route health may have moved since.
            </p>
          </div>
        </div>
      ) : null}

      <div className="panel border-t-[3px] border-t-forest">
        <div className="flex flex-col gap-7 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[34px] font-bold leading-none tracking-tight text-ink sm:text-[40px]">
                IRE
              </h1>
              <span className="rounded-sm border border-line-strong bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                {feed.schemaVersion}
              </span>
              {feed.openWeightOnly ? (
                <span className="rounded-sm border border-forest/35 bg-forest/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-forest">
                  open-weight only
                </span>
              ) : null}
            </div>

            <p className="font-display text-lg font-medium leading-snug text-ink sm:text-xl">
              Daily open-weight model picks for InferHub
            </p>

            <p className="max-w-xl text-sm leading-relaxed text-ink-muted">
              One rebuilt-a-day ledger of routable open-weight models: the route to call,
              the lowest listed ask when the list was built, current route health and a
              recommendation verdict. Read-only — this page holds no key and sends nothing
              anywhere.
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="border-line-strong bg-paper font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:bg-secondary hover:text-ink"
              >
                <RotateCw
                  className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
                  aria-hidden
                />
                {refreshing ? "Re-reading feed" : "Re-read feed"}
              </Button>
              <span className="max-w-sm font-mono text-[11px] leading-relaxed text-ink-muted">
                prices are the lowest listed ask when the list was built; the provider may
                bill more
              </span>
            </div>
          </div>

          <dl className="grid w-full shrink-0 gap-x-8 gap-y-4 border-t border-line pt-4 sm:grid-cols-3 lg:w-auto lg:max-w-md lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                  <fact.icon className="h-3 w-3 shrink-0" aria-hidden />
                  {fact.label}
                </dt>
                <dd className="mt-1 font-display text-sm font-medium leading-snug text-ink">
                  {fact.value}
                </dd>
                <dd className="mt-0.5 font-mono text-[10.5px] leading-snug text-ink-muted">
                  {fact.hint}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}
