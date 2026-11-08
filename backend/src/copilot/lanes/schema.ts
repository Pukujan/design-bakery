/**
 * The tables each lane owns in the Octo workspace, as SQL to review. Printed by scripts/lanes-schema.mjs; nothing here runs it.
 * Content the lanes share (pages and passages, call records, business configs) is not part of a lane and is not listed.
 */
import { TABLE_KINDS, tableName, type LaneManifest } from './types.js';

const COLUMNS: Record<(typeof TABLE_KINDS)[number], string> = {
  flagged_turns: `id bigserial primary key, created_at timestamptz not null default now(), session text, channel text, input text not null, output text, model text, tools text[], reason text not null, trace_id text`,
  replay_cases: `id bigserial primary key, created_at timestamptz not null default now(), name text not null unique, lines jsonb not null, checks jsonb not null, source_flag bigint`,
  eval_sets: `id bigserial primary key, created_at timestamptz not null default now(), name text not null, case_ids bigint[] not null, notes text`,
  judge_settings: `id bigserial primary key, updated_at timestamptz not null default now(), judge_model text not null, rubric text not null, embedder text not null, reranker text not null`,
};

export function createSql(m: LaneManifest): string {
  return TABLE_KINDS.map((kind) => `create table if not exists ${tableName(m, kind)} (${COLUMNS[kind]});`).join('\n');
}
