#!/usr/bin/env node
// Migrate design-bakery content from hosted Supabase (PostgREST) into the
// Octo-provisioned workspace database, via POST /api/workspaces/:id/query.
//
// Idempotent: every table is upserted on its primary key, so this can be
// re-run at cutover to pick up rows added since the first pass.
//
// Env:
//   SUPABASE_URL                 e.g. https://<ref>.supabase.co
//   SUPABASE_ANON_KEY            public read  (published rows only)
//   SUPABASE_SERVICE_ROLE_KEY    optional; required for drafts + agent_tokens
//   OCTO_API_BASE                default https://octodb.design-bakery.com
//   OCTO_WORKSPACE_ID
//   OCTO_WS_KEY
//
// Usage: node scripts/migrate-supabase-to-octo.mjs [--dry-run] [--only=blog_posts,cms_documents]

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const onlyArg = args.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

const SB = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const OCTO = (process.env.OCTO_API_BASE || 'https://octodb.design-bakery.com').replace(/\/$/, '');
const WS = process.env.OCTO_WORKSPACE_ID;
const WS_KEY = process.env.OCTO_WS_KEY;

for (const [k, v] of Object.entries({ SUPABASE_URL: SB, SUPABASE_KEY: SB_KEY, OCTO_WORKSPACE_ID: WS, OCTO_WS_KEY: WS_KEY })) {
  if (!v) { console.error(`missing env: ${k}`); process.exit(2); }
}

const TABLES = ['blog_posts', 'cms_documents', 'media_assets', 'cover_studio_assets', 'publish_kit_hero_cache', 'agent_usage', 'agent_audit', 'agent_tokens'];

async function octo(sql, params = []) {
  const res = await fetch(`${OCTO}/api/workspaces/${WS}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WS_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`octo ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  return body;
}

async function supabaseAll(table) {
  const out = [];
  const page = 500;
  for (let from = 0; ; from += page) {
    const res = await fetch(`${SB}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Range: `${from}-${from + page - 1}`,
      },
    });
    if (res.status === 404) return null; // table absent / not exposed
    if (!res.ok) throw new Error(`supabase ${table} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

const colTypes = new Map(); // table -> Map(col -> udt_name)
const pkCols = new Map();   // table -> [col]

async function introspect(table) {
  const cols = await octo(
    `select column_name, udt_name from information_schema.columns
      where table_schema='public' and table_name=$1`, [table]);
  const pk = await octo(
    `select a.attname from pg_index i
       join pg_attribute a on a.attrelid=i.indrelid and a.attnum = any(i.indkey)
      where i.indrelid = $1::regclass and i.indisprimary`, [`public.${table}`]);
  colTypes.set(table, new Map(cols.rows.map((r) => [r.column_name, r.udt_name])));
  pkCols.set(table, pk.rows.map((r) => r.attname));
}

const JSONB = new Set(['jsonb', 'json']);
const NUMERIC = new Set(['int2', 'int4', 'int8', 'float4', 'float8', 'numeric']);

function bind(value, udt, idx) {
  if (value === null || value === undefined) return { sql: `$${idx}`, param: null };
  if (JSONB.has(udt)) return { sql: `$${idx}::jsonb`, param: JSON.stringify(value) };
  if (typeof value === 'object') return { sql: `$${idx}::jsonb`, param: JSON.stringify(value) };
  if (udt === 'bool') return { sql: `$${idx}::boolean`, param: value };
  if (NUMERIC.has(udt) && udt !== 'text') return { sql: `$${idx}`, param: value };
  return { sql: `$${idx}`, param: typeof value === 'string' ? value : String(value) };
}

async function migrate(table) {
  const present = await octo(
    `select 1 from information_schema.tables where table_schema='public' and table_name=$1`, [table]);
  if (!present.rows.length) { console.log(`  ${table}: not in octo — skip`); return; }

  const rows = await supabaseAll(table);
  if (rows === null) { console.log(`  ${table}: not exposed in Supabase — skip`); return; }
  if (!rows.length) { console.log(`  ${table}: 0 rows — skip`); return; }

  await introspect(table);
  const types = colTypes.get(table);
  const pk = pkCols.get(table);
  if (!pk.length) { console.log(`  ${table}: no primary key — skip (cannot upsert)`); return; }

  // Only carry columns that exist on both sides.
  const cols = Object.keys(rows[0]).filter((c) => types.has(c));
  const skipped = Object.keys(rows[0]).filter((c) => !types.has(c));
  if (skipped.length) console.log(`  ${table}: ignoring octo-absent columns: ${skipped.join(', ')}`);

  const CHUNK = 50;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const params = [];
    const tuples = batch.map((row) => {
      const cells = cols.map((c) => {
        const { sql, param } = bind(row[c], types.get(c), params.length + 1);
        params.push(param);
        return sql;
      });
      return `(${cells.join(',')})`;
    });
    const nonPk = cols.filter((c) => !pk.includes(c));
    const update = nonPk.map((c) => `"${c}"=excluded."${c}"`).join(',');
    const sql =
      `insert into public."${table}" (${cols.map((c) => `"${c}"`).join(',')}) values ${tuples.join(',')}\n` +
      `on conflict (${pk.map((c) => `"${c}"`).join(',')}) do update set ${update}`;
    if (DRY) {
      console.log(`  [dry-run] ${table}: would upsert ${batch.length} rows`);
    } else {
      await octo(sql, params);
    }
    written += batch.length;
  }
  console.log(`  ${table}: ${written}/${rows.length} rows ${DRY ? 'prepared' : 'upserted'}`);
}

const main = async () => {
  console.log(`Supabase ${SB}  →  Octo ${OCTO} (workspace ${WS})`);
  console.log(`key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon (published rows only)'}${DRY ? '  [DRY RUN]' : ''}`);
  for (const t of TABLES) {
    if (ONLY && !ONLY.has(t)) continue;
    console.log(`${t}:`);
    try { await migrate(t); } catch (e) { console.error(`  ${t}: FAILED — ${e.message}`); process.exitCode = 1; }
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\nnote: no SUPABASE_SERVICE_ROLE_KEY — unpublished drafts and agent_tokens were not readable.');
  }
};

main();
