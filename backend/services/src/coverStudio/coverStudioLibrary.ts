import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../supabaseClient.js';
import { parseImageDataUrl } from '../media/parseDataUrl.js';
import { slugifyFilename } from '../media/slugifyFilename.js';
import { deleteCoverStudioStoragePath, uploadCoverStudioBuffer } from './coverStudioStorage.js';
import { MAX_COVER_STUDIO_TAGS } from './constants.js';

export type CoverStudioAssetDto = {
  id: string;
  filename: string;
  slug: string | null;
  metaTags: string[];
  formatId: string | null;
  platform: string | null;
  packId: string | null;
  packTitle: string | null;
  url: string;
  storagePath: string;
  contentType: string;
  byteSize: number | null;
  altText: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoverStudioPackDto = {
  packId: string;
  title: string;
  tags: string[];
  coverUrl: string;
  exportCount: number;
  createdAt: string;
  assets: CoverStudioAssetDto[];
};

type CoverStudioAssetRow = {
  id: string;
  filename: string;
  slug?: string | null;
  meta_tags?: unknown;
  format_id?: string | null;
  platform?: string | null;
  pack_id?: string | null;
  pack_title?: string | null;
  storage_path: string;
  url: string;
  content_type: string;
  byte_size: number | null;
  alt_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const COVER_FORMAT_PRIORITY = [
  'instagram-post',
  'instagram-portrait',
  'facebook-post',
  'linkedin-post',
  'x-post',
] as const;

const PLATFORM_FORMAT_IDS = new Set([
  'instagram-post',
  'instagram-portrait',
  'instagram-story',
  'linkedin-post',
  'linkedin-cover',
  'facebook-post',
  'facebook-cover',
  'tiktok-video',
  'x-post',
]);

function rowToDto(row: CoverStudioAssetRow): CoverStudioAssetDto {
  return {
    id: row.id,
    filename: row.filename,
    slug: row.slug ?? null,
    metaTags: Array.isArray(row.meta_tags) ? (row.meta_tags as string[]) : [],
    formatId: row.format_id ?? null,
    platform: row.platform ?? null,
    packId: row.pack_id ?? null,
    packTitle: row.pack_title ?? null,
    url: row.url,
    storagePath: row.storage_path,
    contentType: row.content_type,
    byteSize: row.byte_size,
    altText: row.alt_text,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function displayFilename(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim() || 'image';
  return `${base}.${ext}`;
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) return [];
  const set = new Set<string>();
  for (const tag of tags) {
    const clean = String(tag).trim().toLowerCase().replace(/[^a-z0-9 -]+/g, '');
    if (clean.length >= 2) set.add(clean.slice(0, 40));
  }
  return [...set].slice(0, MAX_COVER_STUDIO_TAGS);
}

function visualTagsFromAsset(asset: CoverStudioAssetDto): string[] {
  const skip = new Set<string>();
  for (const id of PLATFORM_FORMAT_IDS) skip.add(id);
  skip.add('hero');
  skip.add('raw');
  skip.add('cover studio');

  return asset.metaTags.filter((tag) => {
    const key = tag.toLowerCase();
    if (skip.has(key)) return false;
    if (key.includes('instagram') || key.includes('linkedin')) return false;
    if (key.includes('facebook') || key.includes('tiktok')) return false;
    return true;
  });
}

function legacyPackKey(asset: CoverStudioAssetDto): string {
  const match = asset.slug?.match(/-(\d{10,})$/);
  if (match) return `legacy-${match[1]}`;
  return `legacy-${asset.id}`;
}

function pickCoverAsset(assets: CoverStudioAssetDto[]): CoverStudioAssetDto {
  const exports = assets.filter((a) => a.formatId !== 'hero-raw');
  for (const formatId of COVER_FORMAT_PRIORITY) {
    const match = exports.find((a) => a.formatId === formatId);
    if (match) return match;
  }
  return exports[0] ?? assets[0];
}

export function groupCoverStudioAssetsIntoPacks(assets: CoverStudioAssetDto[]): CoverStudioPackDto[] {
  const buckets = new Map<string, CoverStudioAssetDto[]>();

  for (const asset of assets) {
    const key = asset.packId ?? legacyPackKey(asset);
    const list = buckets.get(key) ?? [];
    list.push(asset);
    buckets.set(key, list);
  }

  const packs: CoverStudioPackDto[] = [];

  for (const [packId, packAssets] of buckets) {
    const sorted = [...packAssets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const cover = pickCoverAsset(sorted);
    const title =
      sorted.find((a) => a.packTitle?.trim())?.packTitle?.trim() ??
      cover.altText?.split(' — ')[0]?.trim() ??
      cover.filename.replace(/\.[^.]+$/, '');
    const tagSource = sorted.find((a) => visualTagsFromAsset(a).length > 0) ?? cover;
    const exports = sorted.filter((a) => a.formatId !== 'hero-raw');

    packs.push({
      packId,
      title,
      tags: visualTagsFromAsset(tagSource),
      coverUrl: cover.url,
      exportCount: exports.length,
      createdAt: sorted[0]?.createdAt ?? cover.createdAt,
      assets: sorted,
    });
  }

  return packs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listCoverStudioAssets(): Promise<CoverStudioAssetDto[]> {
  const { data, error } = await supabaseAdmin()
    .from('cover_studio_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Cover Studio list failed: ${error.message}`);
  return (data as CoverStudioAssetRow[]).map(rowToDto);
}

export async function listCoverStudioPacks(): Promise<CoverStudioPackDto[]> {
  const assets = await listCoverStudioAssets();
  return groupCoverStudioAssetsIntoPacks(assets);
}

function isMissingColumnError(message: string, column: string): boolean {
  const m = message.toLowerCase();
  const col = column.toLowerCase();
  return m.includes(col) && (m.includes('column') || m.includes('schema cache'));
}

async function insertCoverStudioRow(row: Record<string, unknown>): Promise<void> {
  const tryInsert = async (payload: Record<string, unknown>) => {
    return supabaseAdmin().from('cover_studio_assets').insert(payload);
  };

  let { error } = await tryInsert(row);
  if (!error) return;

  let payload = { ...row };
  if (isMissingColumnError(error.message, 'pack_id') || isMissingColumnError(error.message, 'pack_title')) {
    const { pack_id: _p, pack_title: _t, ...rest } = payload;
    payload = rest;
    ({ error } = await tryInsert(payload));
    if (!error) return;
  }

  if (isMissingColumnError(error.message, 'format_id') || isMissingColumnError(error.message, 'platform')) {
    const { format_id: _f, platform: _pl, ...rest } = payload;
    payload = rest;
    ({ error } = await tryInsert(payload));
    if (!error) return;
  }

  throw new Error(`Cover Studio insert failed: ${error.message}`);
}

type CoverStudioAssetInput = {
  buffer: Buffer;
  filename?: string;
  slug?: string;
  tags?: string[];
  altText?: string;
  notes?: string;
  formatId?: string;
  platform?: string;
};

async function persistCoverStudioAsset(
  file: CoverStudioAssetInput,
  packId: string,
  packTitle: string | null,
): Promise<CoverStudioAssetDto> {
  const contentType = 'image/png';
  const ext = 'png';
  const id = randomUUID();
  const basename = (file.filename?.trim() || 'image').replace(/\.[^.]+$/, '');
  const filename = displayFilename(basename, ext);
  const slug = slugifyFilename(file.slug?.trim() || basename);
  const tags = normalizeTags(file.tags);

  const { url, path } = await uploadCoverStudioBuffer({
    assetId: id,
    filename: basename,
    buffer: file.buffer,
    contentType,
    ext,
  });

  const now = new Date().toISOString();
  const row = {
    id,
    filename,
    slug,
    meta_tags: tags,
    storage_path: path,
    url,
    content_type: contentType,
    byte_size: file.buffer.length,
    alt_text: file.altText?.trim() || null,
    notes: file.notes?.trim() || null,
    format_id: file.formatId?.trim() || null,
    platform: file.platform?.trim() || null,
    pack_id: packId,
    pack_title: packTitle,
    created_at: now,
    updated_at: now,
  };

  await insertCoverStudioRow(row);
  return rowToDto(row as CoverStudioAssetRow);
}

export async function saveCoverStudioPackFromBuffers(
  files: CoverStudioAssetInput[],
  options?: { packId?: string; packTitle?: string },
): Promise<{ packId: string; assets: CoverStudioAssetDto[] }> {
  const packId = options?.packId ?? randomUUID();
  const packTitle = options?.packTitle?.trim() || null;
  const assets: CoverStudioAssetDto[] = [];

  for (const file of files) {
    assets.push(await persistCoverStudioAsset(file, packId, packTitle));
  }

  return { packId, assets };
}

export async function uploadCoverStudioAssets(
  files: {
    filename?: string;
    dataUrl: string;
    slug?: string;
    tags?: string[];
    altText?: string;
    notes?: string;
    formatId?: string;
    platform?: string;
  }[],
  options?: { packId?: string; packTitle?: string },
): Promise<CoverStudioAssetDto[]> {
  const buffers: CoverStudioAssetInput[] = files.map((file) => {
    const { buffer } = parseImageDataUrl(file.dataUrl);
    return {
      buffer,
      filename: file.filename,
      slug: file.slug,
      tags: file.tags,
      altText: file.altText,
      notes: file.notes,
      formatId: file.formatId,
      platform: file.platform,
    };
  });
  const { assets } = await saveCoverStudioPackFromBuffers(buffers, options);
  return assets;
}

export async function deleteCoverStudioAsset(id: string): Promise<void> {
  const { data, error: readErr } = await supabaseAdmin()
    .from('cover_studio_assets')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  if (readErr) throw new Error(`Cover Studio read failed: ${readErr.message}`);
  if (!data) return;

  await deleteCoverStudioStoragePath(data.storage_path as string);
  const { error } = await supabaseAdmin().from('cover_studio_assets').delete().eq('id', id);
  if (error) throw new Error(`Cover Studio delete failed: ${error.message}`);
}

export async function deleteCoverStudioPack(packId: string): Promise<void> {
  const { data, error: readErr } = await supabaseAdmin()
    .from('cover_studio_assets')
    .select('id, storage_path')
    .eq('pack_id', packId);

  if (readErr) throw new Error(`Cover Studio pack read failed: ${readErr.message}`);
  if (!data?.length) return;

  for (const row of data) {
    await deleteCoverStudioStoragePath(row.storage_path as string);
  }

  const { error } = await supabaseAdmin().from('cover_studio_assets').delete().eq('pack_id', packId);
  if (error) throw new Error(`Cover Studio pack delete failed: ${error.message}`);
}
