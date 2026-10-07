/**
 * Public site files on Octo's file API (TASK-DB-0074).
 *
 * An upload lands in the private bucket, then POST /api/files/:id/publish copies
 * that one object into the public bucket. Callers store the HTTPS URL Octo
 * returns (`https://files.design-bakery.com/<fileId>`). Signed download links
 * expire and are never stored. The private bucket stays private.
 *
 * GET /api/public/assets/:fileId still streams a `db-public-…` object for any
 * URL already stored in that shape. New uploads do not use it.
 *
 * Callers store the octo file id (a UUID) in `storage_path`. Older rows still
 * hold a Supabase object path; those deletes stay on supabaseClient.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_NAME_PREFIX = 'db-public-';
const DEFAULT_PUBLIC_FILES_HOST = 'files.design-bakery.com';
const OWN_ASSET_RE =
  /\/api\/public\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export class OctoFileError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'OctoFileError';
    this.status = status;
  }
}

export function isOctoFileId(value: string): boolean {
  return UUID_RE.test(value);
}

export function isAssetStorageConfigured(): boolean {
  return Boolean(process.env.OCTO_WORKSPACE_ID?.trim() && process.env.OCTO_API_KEY?.trim());
}

function requireConfig(): { base: string; workspace: string; key: string } {
  const workspace = process.env.OCTO_WORKSPACE_ID?.trim();
  const key = process.env.OCTO_API_KEY?.trim();
  if (!workspace || !key) {
    throw new OctoFileError(
      'Octo file storage is not configured. Set OCTO_WORKSPACE_ID and OCTO_API_KEY in backend/.env.',
      500,
    );
  }
  const base = (process.env.OCTO_API_BASE?.trim() || 'https://octodb.design-bakery.com').replace(/\/$/, '');
  return { base, workspace, key };
}

/** Origin of the legacy proxy route. New uploads store the publish URL instead. */
export function assetPublicBase(): string {
  const explicit = process.env.ASSET_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const httpsOrigin = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .find((origin) => origin.startsWith('https://'));
  if (httpsOrigin) return httpsOrigin;
  const port = process.env.PORT?.trim() || '8787';
  return `http://localhost:${port}`;
}

export function publicAssetUrl(fileId: string): string {
  return `${assetPublicBase()}/api/public/assets/${fileId}`;
}

/** Flat object name. Octo replaces every character outside [A-Za-z0-9._-] with `_`. */
export function publicObjectName(logicalPath: string): string {
  const flat = logicalPath
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
  const base = flat || 'file';
  return base.startsWith(PUBLIC_NAME_PREFIX) ? base : `${PUBLIC_NAME_PREFIX}${base}`;
}

export function isPublicObjectName(name: string): boolean {
  return name.startsWith(PUBLIC_NAME_PREFIX);
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const body = (await res.json().catch(() => ({}))) as unknown;
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

function errorMessage(body: Record<string, unknown>, fallback: string): string {
  const message = body.message ?? body.error;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

function stringField(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

/** A publish URL is https, has no query, and its path is exactly the file id. */
function isStablePublicFileUrl(url: string, fileId: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.search === '' &&
      parsed.hash === '' &&
      parsed.pathname === `/${fileId}`
    );
  } catch {
    return false;
  }
}

function publicFileHosts(): Set<string> {
  const hosts = new Set<string>([DEFAULT_PUBLIC_FILES_HOST]);
  const configured = process.env.OCTO_PUBLIC_FILES_BASE?.trim();
  if (!configured) return hosts;
  try {
    hosts.add(new URL(configured).hostname.toLowerCase());
  } catch {
    /* ignore a malformed override; the default host still matches */
  }
  return hosts;
}

async function publishOctoFile(fileId: string): Promise<string> {
  const { base, workspace, key } = requireConfig();
  const res = await fetch(
    `${base}/api/files/${encodeURIComponent(fileId)}/publish?workspaceId=${encodeURIComponent(workspace)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${key}` } },
  );
  const body = await readJson(res);
  if (!res.ok) {
    throw new OctoFileError(errorMessage(body, `Octo publish failed (HTTP ${res.status})`), res.status);
  }
  const url = stringField(body, 'url');
  if (!url || !isStablePublicFileUrl(url, fileId)) {
    throw new OctoFileError('Octo publish did not return a stable public file URL.', 502);
  }
  return url;
}

export async function uploadOctoPublicFile(params: {
  logicalPath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ fileId: string; url: string; name: string }> {
  if (params.buffer.byteLength === 0) {
    throw new OctoFileError('Refusing to upload an empty file.', 400);
  }
  const { base, workspace, key } = requireConfig();
  const name = publicObjectName(params.logicalPath);
  const res = await fetch(`${base}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: workspace,
      name,
      mimeType: params.contentType,
      data: params.buffer.toString('base64'),
      dataEncoding: 'base64',
    }),
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new OctoFileError(errorMessage(body, `Octo upload failed (HTTP ${res.status})`), res.status);
  }
  const fileId = stringField(body, 'id');
  if (!fileId || !isOctoFileId(fileId)) {
    throw new OctoFileError('Octo upload did not return a file id.', 502);
  }
  try {
    const url = await publishOctoFile(fileId);
    return { fileId, url, name };
  } catch (err) {
    let leftover: string | null = null;
    try {
      await deleteOctoFile(fileId);
    } catch (cleanupErr) {
      leftover = cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr);
    }
    const reason = err instanceof Error ? err.message : String(err);
    const status = err instanceof OctoFileError ? err.status : 502;
    const extra = leftover ? ` The private upload is still in the workspace (${leftover}).` : '';
    throw new OctoFileError(`${reason}${extra}`, status);
  }
}

export async function deleteOctoFile(fileId: string): Promise<void> {
  if (!isOctoFileId(fileId)) {
    throw new OctoFileError(`Not an octo file id: ${fileId}`, 400);
  }
  const { base, workspace, key } = requireConfig();
  const unpublish = await fetch(
    `${base}/api/files/${encodeURIComponent(fileId)}/unpublish?workspaceId=${encodeURIComponent(workspace)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${key}` } },
  );
  if (unpublish.status !== 404 && !unpublish.ok) {
    const body = await readJson(unpublish);
    throw new OctoFileError(
      errorMessage(body, `Octo unpublish failed (HTTP ${unpublish.status})`),
      unpublish.status,
    );
  }
  const res = await fetch(
    `${base}/api/files/${encodeURIComponent(fileId)}?workspaceId=${encodeURIComponent(workspace)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } },
  );
  if (res.status === 404) return;
  if (!res.ok) {
    const body = await readJson(res);
    const message = errorMessage(body, `Octo delete failed (HTTP ${res.status})`);
    if (res.status === 403 && /missing the required 'delete' scope/i.test(message)) {
      throw new OctoFileError(
        `${message}. Mint the workspace key with the delete scope to remove public assets.`,
        res.status,
      );
    }
    throw new OctoFileError(message, res.status);
  }
}

type OctoFileMeta = { name: string; mimeType: string };

async function fetchOctoFileMeta(fileId: string): Promise<OctoFileMeta | null> {
  const { base, workspace, key } = requireConfig();
  const res = await fetch(
    `${base}/api/files/download?workspaceId=${encodeURIComponent(workspace)}&fileId=${encodeURIComponent(fileId)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (res.status === 404) return null;
  const body = await readJson(res);
  if (!res.ok) {
    throw new OctoFileError(errorMessage(body, `Octo file lookup failed (HTTP ${res.status})`), res.status);
  }
  const file = body.file;
  if (!file || typeof file !== 'object') return null;
  const record = file as Record<string, unknown>;
  const name = stringField(record, 'name');
  if (!name) return null;
  return { name, mimeType: stringField(record, 'mimeType') ?? 'application/octet-stream' };
}

export type OctoPublicFile = { bytes: Buffer; contentType: string; name: string };

/** Bytes for one public asset, or null when the id is missing or not a public object. */
export async function readOctoPublicFile(fileId: string): Promise<OctoPublicFile | null> {
  if (!isOctoFileId(fileId)) return null;
  const meta = await fetchOctoFileMeta(fileId);
  if (!meta || !isPublicObjectName(meta.name)) return null;

  const { base, workspace, key } = requireConfig();
  const res = await fetch(
    `${base}/api/files/content?workspaceId=${encodeURIComponent(workspace)}&fileId=${encodeURIComponent(fileId)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new OctoFileError(text.slice(0, 300) || `Octo content failed (HTTP ${res.status})`, res.status);
  }
  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || meta.mimeType,
    name: meta.name,
  };
}

function fileIdFromStoredUrl(url: string): string | null {
  const trimmed = url.trim();
  const proxy = trimmed.match(OWN_ASSET_RE);
  if (proxy?.[1]) return proxy[1];
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.search !== '' || parsed.hash !== '') return null;
  if (!publicFileHosts().has(parsed.hostname.toLowerCase())) return null;
  const id = parsed.pathname.slice(1);
  return UUID_RE.test(id) ? id : null;
}

/**
 * Read a URL this API stored, using the workspace key instead of HTTP.
 * Matches the legacy proxy path and a stable public-file URL. Returns null
 * for every other URL so callers fall back to fetch.
 */
export async function readOwnPublicAsset(url: string): Promise<Buffer | null> {
  const fileId = fileIdFromStoredUrl(url);
  if (!fileId) return null;
  const file = await readOctoPublicFile(fileId);
  return file?.bytes ?? null;
}
