/**
 * Data access for the octo-provisioned workspace database (TASK-DB-0074).
 *
 * The backend reaches octo's SQL surface — `POST /api/workspaces/:id/query` — with a
 * workspace API key. No Postgres connection string is held anywhere: octo's own
 * `docs/consuming-octo.md` states the string is returned exactly once at provisioning
 * and there is no reveal route, so the SQL surface is the supported way in.
 *
 * octo runs each statement as the workspace's OWN role, which owns these tables, so
 * RLS is bypassed for the backend exactly as Supabase's `service_role` bypassed it.
 * The consequence to keep in mind: a policy that used to hide rows is now inert, so
 * every visibility rule must be an explicit WHERE clause (see blogPosts.listBlogPosts).
 */

export class DbError extends Error {
  /** Postgres SQLSTATE, when octo reports one (e.g. 23505 unique_violation). */
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DbError';
    this.code = code;
  }
}

export type DbResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  statementCount: number;
  truncated: boolean;
};

export function isDataLayerConfigured(): boolean {
  return Boolean(process.env.OCTO_WORKSPACE_ID?.trim() && process.env.OCTO_API_KEY?.trim());
}

function requireConfig(): { base: string; workspace: string; key: string } {
  const workspace = process.env.OCTO_WORKSPACE_ID?.trim();
  const key = process.env.OCTO_API_KEY?.trim();
  if (!workspace || !key) {
    throw new Error(
      'The octo data layer is not configured. Set OCTO_WORKSPACE_ID and OCTO_API_KEY in backend/.env.',
    );
  }
  const base = (process.env.OCTO_API_BASE?.trim() || 'https://octodb.design-bakery.com').replace(/\/$/, '');
  return { base, workspace, key };
}

/**
 * Run SQL against the workspace database. Parameterized calls are a single statement
 * (octo uses the extended protocol); a parameterless call may carry several.
 */
export async function dbQuery(sql: string, params: unknown[] = []): Promise<DbResult> {
  const { base, workspace, key } = requireConfig();
  const res = await fetch(`${base}/api/workspaces/${workspace}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(params.length > 0 ? { sql, params } : { sql }),
  });

  const body = (await res.json().catch(() => ({}))) as Partial<DbResult> & {
    error?: string;
    message?: string;
    code?: string;
  };

  if (!res.ok) {
    // octo reports a statement the database rejected as { error: 'SQL_ERROR', message, code }.
    throw new DbError(body.message ?? body.error ?? `octo query failed (HTTP ${res.status})`, body.code);
  }

  return {
    columns: body.columns ?? [],
    rows: body.rows ?? [],
    rowCount: body.rowCount ?? 0,
    statementCount: body.statementCount ?? 1,
    truncated: body.truncated ?? false,
  };
}

/** Rows as typed records. */
export async function dbQueryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await dbQuery(sql, params);
  return result.rows as T[];
}

/** First row, or null. */
export async function dbQueryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const result = await dbQuery(sql, params);
  return (result.rows[0] as T | undefined) ?? null;
}

/** Run a statement for its effect; returns the affected row count. */
export async function dbExec(sql: string, params: unknown[] = []): Promise<number> {
  const result = await dbQuery(sql, params);
  return result.rowCount;
}

// --------------------------------------------------------------------------- helpers
// Small builders for the write shapes the call sites repeat (insert a row, patch a row
// by id, delete by a column). Reads stay as explicit SQL — they are the queries whose
// WHERE clauses carry the visibility rules, and those are worth reading in full.

const IDENT = /^[a-z_][a-z0-9_]*$/;
function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Unsafe SQL identifier: ${name}`);
  return `"${name}"`;
}

/** Bind one value, JSON-encoding objects/arrays for jsonb columns. */
function bind(value: unknown, params: unknown[]): string {
  if (value !== null && typeof value === 'object') {
    params.push(JSON.stringify(value));
    return `$${params.length}::jsonb`;
  }
  params.push(value);
  return `$${params.length}`;
}

function whereClause(where: Record<string, unknown>, params: unknown[]): string {
  return Object.entries(where)
    .map(([col, value]) => `${ident(col)} = ${bind(value, params)}`)
    .join(' and ');
}

export async function dbInsert<T = Record<string, unknown>>(
  table: string,
  row: Record<string, unknown>,
  returning = 'id',
): Promise<T> {
  const params: unknown[] = [];
  const cols = Object.keys(row);
  const values = cols.map((col) => bind(row[col], params));
  const sql =
    `insert into public.${ident(table)} (${cols.map(ident).join(', ')}) ` +
    `values (${values.join(', ')}) returning ${returning}`;
  const rows = await dbQueryAll<T>(sql, params);
  const first = rows[0];
  if (first === undefined) throw new DbError(`Insert into ${table} returned no row`);
  return first;
}

export async function dbUpdate<T = Record<string, unknown>>(
  table: string,
  patch: Record<string, unknown>,
  where: Record<string, unknown>,
  returning?: string,
): Promise<T[]> {
  const params: unknown[] = [];
  const sets = Object.keys(patch).map((col) => `${ident(col)} = ${bind(patch[col], params)}`);
  const clause = whereClause(where, params);
  const sql =
    `update public.${ident(table)} set ${sets.join(', ')} where ${clause}` +
    (returning ? ` returning ${returning}` : '');
  const result = await dbQuery(sql, params);
  return result.rows as T[];
}

export async function dbDelete(table: string, where: Record<string, unknown>): Promise<number> {
  const params: unknown[] = [];
  const sql = `delete from public.${ident(table)} where ${whereClause(where, params)}`;
  return dbExec(sql, params);
}
