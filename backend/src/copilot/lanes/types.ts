/**
 * A lane: one kind of model with everything it needs, in its own folder, so it can be tested, tuned and switched without touching
 * another. A lane is a manifest (what it uses and its limits) plus its own fixes (what its models need that others do not).
 *
 *   lanes/<name>/manifest.ts   which providers, which tools, the limits, the names of its own tables
 *   lanes/<name>/fixes/        per-model workarounds, e.g. how to switch thinking off for its models
 *   lanes/<name>/tests/        its own scenarios, scored on their own (scripts/sim/lanes.json lists them)
 *
 * A lane never imports another lane (scripts/check-lanes.mjs fails the build if it does). COPILOT_LANE picks one; the others are
 * never loaded.
 */
export type Channel = 'voice' | 'chat';

export type LaneManifest = {
  name: 'strong' | 'hybrid' | 'small';
  description: string;
  /** Provider ids (providers.ts) in the order this lane tries them. `dev` is the local LFM3. */
  providers: string[];
  /** Tools this lane's model is offered, by name: a closed list. 'all' keeps every tool the route builds. */
  tools: 'all' | string[];
  limits: {
    maxSteps: Record<Channel, number>;
    maxOutputTokens: Record<Channel, number>;
    /** A model that has not started by now gives way to the next one, in ms. */
    startMs: Record<Channel, number>;
  };
  /** Table names this lane owns in the Octo workspace (lanes/schema.ts makes the SQL). Shared content tables are not listed here. */
  tables: { prefix: string };
  /** Named per lane so a change in one is measured on its own. */
  embedder: string;
  reranker: string;
};

export type Lane = {
  manifest: LaneManifest;
  /** Request-body switches this lane's models need (thinking off and the like). `step` is "<provider>:<model>". */
  adjustBody: (step: string, body: Record<string, unknown>) => Record<string, unknown>;
  /** Extra lines for the end of the system prompt, for models that need more spelling out. */
  promptNote?: string;
};

export const LANE_NAMES = ['strong', 'hybrid', 'small'] as const;
export const TABLE_KINDS = ['flagged_turns', 'replay_cases', 'eval_sets', 'judge_settings'] as const;
export const tableName = (m: LaneManifest, kind: (typeof TABLE_KINDS)[number]) => `${m.tables.prefix}_${kind}`;
