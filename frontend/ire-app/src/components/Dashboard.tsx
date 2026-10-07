import { useState } from "react";
import { CapabilityChart } from "@/components/CapabilityChart";
import { HealthSummary } from "@/components/HealthSummary";
import { PicksHero } from "@/components/PicksHero";
import { PicksTable } from "@/components/PicksTable";
import { PriceChart } from "@/components/PriceChart";
import { ProvenanceFooter } from "@/components/ProvenanceFooter";
import { TierTabs } from "@/components/TierTabs";
import { UtilitySection } from "@/components/UtilitySection";
import {
  getTier,
  TIER_LABELS,
  tierOrder,
  type Feed,
  type TierKey,
} from "@/lib/feed";

interface DashboardProps {
  feed: Feed;
  onRefresh: () => void;
  refreshing: boolean;
}

/** The whole ledger: hero, tier switch, charts, health, table, utilities, receipts. */
export function Dashboard({ feed, onRefresh, refreshing }: DashboardProps) {
  const [requested, setRequested] = useState<TierKey>("cheap");

  const keys = tierOrder(feed);
  const tierKey = keys.includes(requested) ? requested : keys[0];
  const tier = getTier(feed, tierKey);
  const tierLabel = TIER_LABELS[tierKey];

  return (
    <div className="space-y-5">
      <PicksHero feed={feed} onRefresh={onRefresh} refreshing={refreshing} />

      <TierTabs feed={feed} value={tierKey} onChange={setRequested} />

      <PriceChart rows={tier.entries} tierLabel={tierLabel} />

      <CapabilityChart
        rows={tier.entries}
        tierKey={tierKey}
        tierLabel={tierLabel}
      />

      <HealthSummary rows={tier.entries} tierLabel={tierLabel} />

      <PicksTable
        rows={tier.entries}
        tierLabel={tierLabel}
        listName={tier.list}
        asOf={tier.asOf}
      />

      {feed.tiers.utility ? <UtilitySection tier={feed.tiers.utility} /> : null}

      <ProvenanceFooter feed={feed} />
    </div>
  );
}
