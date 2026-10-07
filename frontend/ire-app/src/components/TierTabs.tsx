import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIER_LABELS, tierOrder, type Feed, type TierKey } from "@/lib/feed";
import { formatLocalDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TierTabsProps {
  feed: Feed;
  value: TierKey;
  onChange: (key: TierKey) => void;
}

/** Section 2 — scopes the table, the charts and the health summary to one tier. */
export function TierTabs({ feed, value, onChange }: TierTabsProps) {
  const keys = tierOrder(feed);
  const activeKey = keys.includes(value) ? value : keys[0];
  const active = activeKey === "utility" ? feed.tiers.utility : feed.tiers[activeKey];

  return (
    <div className="panel px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-[15px] font-semibold text-ink sm:text-base">
          Which list are you reading?
        </h2>
        <span className="font-mono text-[11px] text-ink-muted">
          {active ? `${active.entries.length} rows · source list ${active.list}` : ""}
        </span>
      </div>

      <Tabs
        data-testid="tier-tabs"
        value={activeKey}
        onValueChange={(next) => onChange(next as TierKey)}
        className="mt-3"
      >
        <TabsList className="h-auto w-full flex-col items-stretch justify-start gap-1 rounded-md border border-line bg-paper p-1 sm:w-auto sm:flex-row">
          {keys.map((key) => {
            const tier = key === "utility" ? feed.tiers.utility : feed.tiers[key];
            if (!tier) return null;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  "w-full justify-between gap-2 rounded-sm px-3 py-2 text-sm font-medium text-ink-muted transition-colors",
                  "data-[state=active]:bg-forest data-[state=active]:text-surface data-[state=active]:shadow-none",
                  "hover:data-[state=inactive]:bg-secondary hover:data-[state=inactive]:text-ink",
                  "sm:w-auto sm:justify-center",
                )}
              >
                <span>{TIER_LABELS[key]}</span>
                <span
                  className={cn(
                    "num rounded-sm px-1 py-px text-[10px]",
                    key === activeKey
                      ? "bg-surface/20 text-surface"
                      : "bg-secondary text-ink-muted",
                  )}
                >
                  {tier.entries.length}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((key) => {
          const tier = key === "utility" ? feed.tiers.utility : feed.tiers[key];
          if (!tier) return null;
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={isActive}
              className={cn(
                "border-l-2 px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "border-l-forest bg-forest/10"
                  : "border-l-transparent bg-surface hover:bg-secondary",
              )}
            >
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                {TIER_LABELS[key]}
              </span>
              <span
                className={cn(
                  "mt-1 block font-display text-[13px] font-medium",
                  isActive ? "text-forest" : "text-ink",
                )}
              >
                as of {formatLocalDateTime(tier.asOf)}
              </span>
              <span className="mt-0.5 block font-mono text-[10.5px] text-ink-muted">
                {tier.entries.length} open-weight rows
                {tier.dropped > 0 ? ` · ${tier.dropped} dropped` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {active?.description ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{active.description}</p>
      ) : null}

      {active && active.dropped > 0 ? (
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-muted">
          {active.dropped} row{active.dropped === 1 ? "" : "s"} withheld from this view
          because the open-weight verdict was not true.
        </p>
      ) : null}
    </div>
  );
}
