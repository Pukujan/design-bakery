export const FEED_URL =
  "https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v2/today.json";

export type HealthStatus =
  | "healthy"
  | "degraded"
  | "failing"
  | "unavailable"
  | "insufficient_data";

export type Confidence = "low" | "medium" | "high";

export type TierKey = "cheap" | "strongest_open" | "utility";

export interface Licence {
  name: string;
  url: string | null;
  weightsUrl: string | null;
}

export interface PickRow {
  id: string;
  rank: number;
  model: string;
  shortModel: string;
  vendor: string | null;
  recommended: boolean;
  gateReasons: string[];
  route: string;
  routes: string[];
  inputPrice: number | null;
  outputPrice: number | null;
  blendedPrice: number | null;
  priceBasis: string | null;
  healthStatus: HealthStatus | null;
  healthConfidence: Confidence | null;
  healthReasons: string[];
  confidence: Confidence | null;
  capability: number | null;
  capabilityTier: string | null;
  priceRegime: string | null;
  openWeight: boolean | null;
  licence: Licence | null;
  utilityKind: string | null;
}

export interface Tier {
  key: TierKey;
  list: string;
  asOf: string | null;
  description: string;
  entries: PickRow[];
  dropped: number;
}

export interface Feed {
  schemaVersion: string;
  generatedAt: string;
  dayEt: string;
  staleAfter: string;
  codeCommit: string | null;
  sourceRepo: string;
  snapshotSha256: string | null;
  openWeightOnly: boolean;
  notice: string;
  tiers: {
    cheap: Tier;
    strongest_open: Tier;
    utility: Tier | null;
  };
}

const GATE_REASON_LABELS: Record<string, string> = {
  not_routing_eligible: "not routable right now",
  insufficient_provider_breadth: "too few providers",
  catalog_availability_below_minimum: "low availability",
  tier_below_minimum: "below the capability tier",
  capability_below_minimum: "capability score too low",
  release_date_unknown: "release date unknown",
  older_generation: "older generation",
  no_healthy_route: "no healthy route",
  missing_price: "no listed price",
  open_weight_unverified: "open-weight licence not verified",
};

/** Translate a gate code into plain English. Unknown codes fall back to spaced text. */
export function gateReasonLabel(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "";
  return GATE_REASON_LABELS[trimmed] ?? trimmed.replace(/_/g, " ");
}

const HEALTH_VALUES: HealthStatus[] = [
  "healthy",
  "degraded",
  "failing",
  "unavailable",
  "insufficient_data",
];

const CONFIDENCE_VALUES: Confidence[] = ["low", "medium", "high"];

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const asHealth = (value: unknown): HealthStatus | null =>
  HEALTH_VALUES.includes(value as HealthStatus) ? (value as HealthStatus) : null;

const asConfidence = (value: unknown): Confidence | null =>
  CONFIDENCE_VALUES.includes(value as Confidence) ? (value as Confidence) : null;

const httpsUrl = (value: unknown): string | null => {
  const url = asString(value);
  return url && url.startsWith("https://") ? url : null;
};

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

/** Cap a model name for tight chart labels; the full name always stays in the data. */
export function shorten(value: string, max = 20): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function toLicence(raw: unknown): Licence | null {
  if (raw === null || raw === undefined) return null;
  const licence = asObject(raw);
  const name = asString(licence.name);
  if (!name) return null;
  return {
    name,
    url: httpsUrl(licence.url),
    weightsUrl: httpsUrl(licence.weights_url),
  };
}

function toRow(raw: unknown, tierKey: TierKey, index: number): PickRow {
  const entry = asObject(raw);
  const price = asObject(entry.price_usd_per_mtok);
  const health = asObject(entry.health);

  const model = asString(entry.model_family) ?? `Entry ${index + 1}`;
  const rank = asNumber(entry.rank) ?? index + 1;
  const inputPrice = asNumber(price.input);
  const outputPrice = asNumber(price.output);
  const blendedPrice =
    inputPrice === null && outputPrice === null
      ? null
      : (inputPrice ?? 0) + (outputPrice ?? 0);

  const gateReasons = asArray(entry.gate_reasons)
    .map((code) => gateReasonLabel(asString(code) ?? ""))
    .filter((label) => label.length > 0);

  const routes = asArray(entry.routes)
    .map((route) => asString(route))
    .filter((route): route is string => route !== null);

  const openWeight = asBoolean(entry.open_weight);

  return {
    id: `${tierKey}-${rank}-${slug(model)}`,
    rank,
    model,
    shortModel: shorten(model),
    vendor: asString(entry.vendor),
    recommended: asBoolean(entry.recommended) ?? false,
    gateReasons,
    route: asString(entry.best_route) ?? routes[0] ?? "—",
    routes,
    inputPrice,
    outputPrice,
    blendedPrice,
    priceBasis: asString(price.basis),
    healthStatus: asHealth(health.status),
    healthConfidence: asConfidence(health.confidence),
    healthReasons: asArray(health.reasons)
      .map((reason) => asString(reason))
      .filter((reason): reason is string => reason !== null),
    confidence: asConfidence(entry.confidence),
    capability: asNumber(entry.capability_score_100),
    capabilityTier: asString(entry.tier),
    priceRegime: asString(entry.price_regime),
    openWeight,
    licence: toLicence(entry.licence),
    utilityKind: asString(entry.utility_kind),
  };
}

function buildTier(key: TierKey, raw: unknown): Tier {
  const tier = asObject(raw);
  const all = asArray(tier.entries).map((entry, index) => toRow(entry, key, index));

  // Text tiers only carry verified open-weight rows; the utility tier also lists
  // rows whose licence is unverified (open_weight === null). `false` is always dropped.
  const entries =
    key === "utility"
      ? all.filter((row) => row.openWeight !== false)
      : all.filter((row) => row.openWeight === true);

  const fallbackList = key === "utility" ? "utility" : "top20";

  return {
    key,
    list: asString(tier.list) ?? fallbackList,
    asOf: asString(tier.as_of),
    description: asString(tier.description) ?? "",
    entries,
    dropped: all.length - entries.length,
  };
}

/** Validate the document and normalise it into the shape the UI renders. */
export function parseFeed(json: unknown): Feed {
  const root = asObject(json);
  const schemaVersion = asString(root.schema_version) ?? "";

  if (!schemaVersion.startsWith("ire-feed/v2")) {
    throw new Error(
      schemaVersion
        ? `Unsupported feed schema "${schemaVersion}" — this page reads ire-feed/v2.`
        : "The feed did not declare a schema_version.",
    );
  }

  const tiers = asObject(root.tiers);
  if (!Array.isArray(asObject(tiers.cheap).entries)) {
    throw new Error("The feed is missing tiers.cheap.entries.");
  }
  if (!Array.isArray(asObject(tiers.strongest_open).entries)) {
    throw new Error("The feed is missing tiers.strongest_open.entries.");
  }

  const utilityRaw = tiers.utility;
  const utility =
    utilityRaw && Array.isArray(asObject(utilityRaw).entries)
      ? buildTier("utility", utilityRaw)
      : null;

  return {
    schemaVersion,
    generatedAt: asString(root.generated_at) ?? "",
    dayEt: asString(root.day_et) ?? "",
    staleAfter: asString(root.stale_after) ?? "",
    codeCommit: asString(root.code_commit),
    sourceRepo: asString(root.source_repo) ?? "",
    snapshotSha256: asString(root.snapshot_sha256),
    openWeightOnly: asBoolean(root.open_weight_only) ?? false,
    notice: asString(root.notice) ?? "",
    tiers: {
      cheap: buildTier("cheap", tiers.cheap),
      strongest_open: buildTier("strongest_open", tiers.strongest_open),
      utility,
    },
  };
}

export const TIER_LABELS: Record<TierKey, string> = {
  cheap: "Cheap",
  strongest_open: "Strongest open-weight",
  utility: "Image and multimodal",
};

export function tierOrder(feed: Feed): TierKey[] {
  return feed.tiers.utility
    ? ["cheap", "strongest_open", "utility"]
    : ["cheap", "strongest_open"];
}

export function getTier(feed: Feed, key: TierKey): Tier {
  return key === "utility" ? (feed.tiers.utility ?? feed.tiers.cheap) : feed.tiers[key];
}
