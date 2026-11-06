/**
 * Keeps a failing case as a replay case in the lane's own table (copilot_<lane>_replay_cases, migration 013), through Octo's
 * query API with the workspace's key from backend/.env. A case with the same name is updated, not duplicated.
 */
const LANES = ['strong', 'hybrid', 'small'];

/** Saves `row` ({ name, lines, checks }) and returns its id. */
export async function saveReplayCase(env, lane, row) {
  if (!LANES.includes(lane)) throw new Error(`unknown lane ${lane}`);
  const workspace = env.OCTO_WORKSPACE_ID?.trim();
  const key = env.OCTO_API_KEY?.trim();
  if (!workspace || !key) throw new Error('OCTO_WORKSPACE_ID and OCTO_API_KEY are not set in backend/.env');
  const raw = env.OCTO_API_BASE?.trim() || 'https://octodb.design-bakery.com';
  const base = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  // The table name comes from the fixed lane list above, never from input; the values are bound parameters.
  const sql = `insert into copilot_${lane}_replay_cases (name, lines, checks) values ($1, $2::jsonb, $3::jsonb)
    on conflict (name) do update set lines = excluded.lines, checks = excluded.checks, created_at = now() returning id`;
  const r = await fetch(`${base}/api/workspaces/${workspace}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params: [row.name, JSON.stringify(row.lines), JSON.stringify(row.checks)] }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`saving the replay case failed: ${body.message ?? body.error ?? `HTTP ${r.status}`}`);
  return body.rows?.[0]?.id ?? body.rows?.[0]?.[0] ?? null;
}
