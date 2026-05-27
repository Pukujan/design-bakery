import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../supabaseClient.js';
import { parseImageDataUrl } from './parseDataUrl.js';
import { deleteMediaStoragePath, uploadMediaBuffer } from './mediaStorage.js';
import { suggestFilenameFromImage, suggestMediaMetaFromImage } from './ocrFilename.js';
import { slugifyFilename } from './slugifyFilename.js';

export type MediaAssetDto = {
  id: string;
  filename: string;
  slug: string | null;
  metaTags: string[];
  url: string;
  storagePath: string;
  contentType: string;
  byteSize: number | null;
  altText: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type MediaAssetRow = {
  id: string;
  filename: string;
  slug?: string | null;
  meta_tags?: unknown;
  storage_path: string;
  url: string;
  content_type: string;
  byte_size: number | null;
  alt_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function rowToDto(row: MediaAssetRow): MediaAssetDto {
  return {
    id: row.id,
    filename: row.filename,
    slug: row.slug ?? null,
    metaTags: Array.isArray(row.meta_tags) ? (row.meta_tags as string[]) : [],
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
  return [...set].slice(0, 20);
}

export async function listMediaAssets(): Promise<MediaAssetDto[]> {
  const { data, error } = await supabaseAdmin()
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Media list failed: ${error.message}`);
  return (data as MediaAssetRow[]).map(rowToDto);
}

export async function getMediaAsset(id: string): Promise<MediaAssetDto | null> {
  const { data, error } = await supabaseAdmin()
    .from('media_assets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Media read failed: ${error.message}`);
  if (!data) return null;
  return rowToDto(data as MediaAssetRow);
}

export async function uploadMediaAssets(
  files: {
    filename?: string;
    dataUrl: string;
    slug?: string;
    tags?: string[];
    altText?: string;
    notes?: string;
  }[],
): Promise<MediaAssetDto[]> {
  const created: MediaAssetDto[] = [];

  for (const file of files) {
    const { buffer, contentType, ext } = parseImageDataUrl(file.dataUrl);
    const id = randomUUID();
    const basename = (file.filename?.trim() || 'image').replace(/\.[^.]+$/, '');
    const filename = displayFilename(basename, ext);
    const slug = slugifyFilename(file.slug?.trim() || basename);
    const tags = normalizeTags(file.tags);

    const { url, path } = await uploadMediaBuffer({
      assetId: id,
      filename: basename,
      buffer,
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
      byte_size: buffer.length,
      alt_text: file.altText?.trim() || null,
      notes: file.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabaseAdmin().from('media_assets').insert(row);
    if (error) throw new Error(`Media insert failed: ${error.message}`);
    created.push(rowToDto(row as MediaAssetRow));
  }

  return created;
}

export async function updateMediaAsset(
  id: string,
  patch: {
    filename?: string;
    slug?: string | null;
    tags?: string[];
    altText?: string | null;
    notes?: string | null;
  },
): Promise<MediaAssetDto> {
  const existing = await getMediaAsset(id);
  if (!existing) throw new Error(`Media asset ${id} not found`);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.filename !== undefined) {
    const ext = existing.filename.includes('.')
      ? existing.filename.split('.').pop()!
      : existing.contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
    updates.filename = displayFilename(patch.filename, ext);
  }
  if (patch.slug !== undefined) updates.slug = patch.slug ? slugifyFilename(patch.slug) : null;
  if (patch.tags !== undefined) updates.meta_tags = normalizeTags(patch.tags);
  if (patch.altText !== undefined) updates.alt_text = patch.altText;
  if (patch.notes !== undefined) updates.notes = patch.notes;

  const { data, error } = await supabaseAdmin()
    .from('media_assets')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Media update failed: ${error.message}`);
  return rowToDto(data as MediaAssetRow);
}

export async function previewMediaMetaFromDataUrl(params: {
  dataUrl: string;
  apiKey: string;
  model?: string;
}): Promise<{
  filename: string;
  slug: string;
  tags: string[];
  rawFilename: string;
  rawTags: string;
  model: string;
}> {
  if (!params.dataUrl.trim().startsWith('data:image/')) {
    throw new Error('Expected data:image URL for OCR preview.');
  }
  return suggestMediaMetaFromImage({
    apiKey: params.apiKey,
    model: params.model,
    imageUrl: params.dataUrl,
  });
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const existing = await getMediaAsset(id);
  if (!existing) return;

  await deleteMediaStoragePath(existing.storagePath);
  const { error } = await supabaseAdmin().from('media_assets').delete().eq('id', id);
  if (error) throw new Error(`Media delete failed: ${error.message}`);
}

export async function ocrRenameMediaAsset(params: {
  id: string;
  apiKey: string;
  model?: string;
}): Promise<MediaAssetDto & { ocrRaw: string; ocrModel: string }> {
  const existing = await getMediaAsset(params.id);
  if (!existing) throw new Error(`Media asset ${params.id} not found`);

  const { filename, raw, model } = await suggestFilenameFromImage({
    apiKey: params.apiKey,
    imageUrl: existing.url,
    model: params.model,
  });

  const updated = await updateMediaAsset(params.id, { filename, slug: filename });
  return { ...updated, ocrRaw: raw, ocrModel: model };
}
