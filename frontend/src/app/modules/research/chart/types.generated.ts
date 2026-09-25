/**
 * GENERATED FILE — do not edit by hand.
 *
 * Source: frontend/src/app/modules/research/chart/schema/research-chart-data.v1.schema.json
 * (Eval Lab, schemas/research-chart-data.v1.schema.json, vendored by `pnpm research:sync-data`
 * and verified against the sha256 in `paper/data/index.json`).
 *
 * Regenerate with `pnpm research:gen-types`; CI fails when this file is stale.
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */

export type Sha256 = string;

export type Commit = string;

export type RepoPath = string;

export type HttpsId = string;

export type NullableNumber = number | null;

export interface SourceEntity {
  id: HttpsId;
  type: 'prov:Entity';
  path: RepoPath;
  sha256: Sha256;
  role: string;
  wasDerivedFrom?: (HttpsId | SourceEntity)[];
}

export interface Provenance {
  summary: string;
  repository: 'https://github.com/Pukujan/Eval-lab';
  commit: Commit;
  dirty: boolean;
  generatedAt: string;
  generator: 'scripts/export_chart_data.py';
  policy: { [key: string]: string; };
  wasGeneratedBy: { id: string; type: 'prov:Activity'; endedAtTime: string; gitCommit: Commit; gitDirty: boolean; wasAssociatedWith: { id: HttpsId; type: unknown[]; path: RepoPath; sha256: Sha256; }; used: HttpsId[]; };
  wasDerivedFrom: SourceEntity[];
}

export interface Measure {
  key: string;
  label: string;
  unit: string;
  format: string;
  better: 'higher' | 'lower' | 'none';
  interval: 'wilson_95' | 'none';
  definition: string;
  n: string;
}

export interface Dimension {
  key: string;
  label: string;
  type: 'nominal' | 'ordinal' | 'quantitative';
  scope: 'entity' | 'slice';
  field?: string;
  unit?: string;
  values?: string[];
}

export interface Entity {
  id: string;
  label: string;
  shortLabel: string;
  headline: boolean;
  experiment: string;
  experimentIds: string[];
  deployment: 'api' | 'local' | 'baseline';
  modelFamily: string;
  modelId: string;
  paramsB: NullableNumber;
  route: string;
  harness?: string;
  settings: { maxOutputTokens: number | null; maxOutputTokensStatus: 'set' | 'provider_default' | 'not_applicable'; contextCapTokens: number | null; thinking: 'on' | 'off' | 'provider_default' | 'not_applicable'; decoding: 'generative_label' | 'label_log_likelihood' | 'native_label_head' | 'constant'; temperature: NullableNumber; };
  settingsEvidence: RepoPath[];
  derived: boolean;
  rankAllRecord?: number | null;
  sharedRankAllRecord?: number | null;
  recordCount: number;
  resolved: number;
  correct: number;
  statusCounts: { [key: string]: number; };
}

export interface Observation {
  entity: string;
  slice: 'overall' | 'mode' | 'taskSource';
  sliceValue: string;
  metric: string;
  value: NullableNumber;
  ciLow: NullableNumber;
  ciHigh: NullableNumber;
  n: number;
}

export interface Dataset {
  kind: 'dataset';
  datasetId: string;
  recordCount: number;
  provenance?: Provenance;
  levels: { key: string; label: string; description: string }[];
  dimensions: Dimension[];
  measures: Measure[];
  entities: Entity[];
  observations: Observation[];
  aggregates: { key: string; metric: string; method: string; over: string; value: unknown }[];
  comparisons: {
    left: string;
    right: string;
    view: 'all' | 'shared';
    n: number;
    leftOnlyCorrect: number;
    rightOnlyCorrect: number;
    pExact: number;
    pHolm: number;
  }[];
  experiments: {
    id: string;
    experimentId: string;
    directory: string;
    status: string;
    entities: string[];
  }[];
  runs: {
    entity: string;
    experiment: string;
    experimentDirectory: string;
    runPath: string;
    path: RepoPath;
    sha256: Sha256;
    mergeOrder: number;
  }[];
  notes: {
    definitions?: Record<string, string>;
    excluded?: Record<string, string>;
    notRun?: Record<string, string>;
  };
}

export interface Chart {
  kind: 'chart';
  chartId: string;
  dataset: string | null;
  provenance?: Provenance;
  figure: { variants: { [key: string]: RepoPath; }; };
  data: {
    rows: Record<string, unknown>[];
    title?: string;
    subtitle?: string;
    unit?: string;
    baseline?: number;
  };
}

export interface ChartDataEnvelope {
  '@context': Record<string, unknown>;
  id: string;
  type: string[];
  kind: 'dataset' | 'chart';
  schemaVersion: '1.0';
  title: string;
  description?: string;
  experimentId: string;
  provenance: Provenance;
}

/** A dataset (kind: "dataset") or a pre-rendered figure (kind: "chart") file. */
export type ResearchChartDataFile = (Dataset & ChartDataEnvelope) | (Chart & ChartDataEnvelope);
