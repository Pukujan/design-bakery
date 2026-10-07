import type { HealthStatus, PickRow } from "@/lib/feed";

export interface HealthMeta {
  label: string;
  hex: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
  note: string;
}

export const HEALTH_ORDER: HealthStatus[] = [
  "healthy",
  "degraded",
  "failing",
  "unavailable",
  "insufficient_data",
];

export const HEALTH_META: Record<HealthStatus, HealthMeta> = {
  healthy: {
    label: "Healthy",
    hex: "#2F6B4F",
    badgeClass: "border-forest/35 bg-forest/10 text-forest",
    dotClass: "bg-forest",
    barClass: "bg-forest",
    note: "routes answering normally",
  },
  degraded: {
    label: "Degraded",
    hex: "#8A6B12",
    badgeClass: "border-brass/40 bg-brass/10 text-brass",
    dotClass: "bg-brass",
    barClass: "bg-brass",
    note: "slow or partly erroring",
  },
  failing: {
    label: "Failing",
    hex: "#A6501F",
    badgeClass: "border-oxide/40 bg-oxide/10 text-oxide",
    dotClass: "bg-oxide",
    barClass: "bg-oxide",
    note: "requests mostly erroring",
  },
  unavailable: {
    label: "Unavailable",
    hex: "#5A6354",
    badgeClass: "border-ink-muted/35 bg-ink-muted/10 text-ink-muted",
    dotClass: "bg-ink-muted",
    barClass: "bg-ink-muted",
    note: "no route answering",
  },
  insufficient_data: {
    label: "Not enough data",
    hex: "#6E6A5C",
    badgeClass: "border-line-strong bg-line/50 text-ink-muted",
    dotClass: "bg-line-strong",
    barClass: "bg-line-strong",
    note: "too few probes to judge",
  },
};

/** A missing status is reported as "not enough data" rather than invented. */
export function healthKey(status: HealthStatus | null): HealthStatus {
  return status ?? "insufficient_data";
}

export function healthMeta(status: HealthStatus | null): HealthMeta {
  return HEALTH_META[healthKey(status)];
}

export interface HealthCount {
  key: HealthStatus;
  label: string;
  hex: string;
  count: number;
  share: number;
}

export interface HealthSummary {
  counts: HealthCount[];
  total: number;
  routable: number;
  unusable: number;
}

export function summarizeHealth(rows: PickRow[]): HealthSummary {
  const totals = new Map<HealthStatus, number>(
    HEALTH_ORDER.map((key) => [key, 0]),
  );

  for (const row of rows) {
    const key = healthKey(row.healthStatus);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  const total = rows.length;
  const counts: HealthCount[] = HEALTH_ORDER.map((key) => {
    const count = totals.get(key) ?? 0;
    return {
      key,
      label: HEALTH_META[key].label,
      hex: HEALTH_META[key].hex,
      count,
      share: total > 0 ? count / total : 0,
    };
  });

  const routable = (totals.get("healthy") ?? 0) + (totals.get("degraded") ?? 0);

  return {
    counts,
    total,
    routable,
    unusable: (totals.get("failing") ?? 0) + (totals.get("unavailable") ?? 0),
  };
}
