import { fetchPublic } from '@/lib/contentApi';
import { getAuthApiBaseUrl } from '@/lib/adminToken';
import type { MediaAsset } from '@/lib/mediaLibraryApi';
import type { GalleryPhoto } from '../types';
import { deriveMetaTags, humanizeFilename, slugifyGalleryText } from './deriveGalleryMeta';

const RESERVED_TAGS = new Set(['blog', 'publish-kit', 'ai-generated', 'hero', 'raw', 'og', 'cover']);

function resolveCategory(tags: string[]): string {
  const first = tags.find((t) => !RESERVED_TAGS.has(t));
  return slugifyGalleryText(first || 'general') || 'general';
}

export function mapAssetToGalleryPhoto(asset: MediaAsset): GalleryPhoto {
  const slug = slugifyGalleryText(asset.filename);
  const title = humanizeFilename(asset.filename);
  const altText = asset.altText?.trim() || title;
  const mergedTags = deriveMetaTags([slug, title, altText, asset.notes, asset.filename]);
  const category = resolveCategory([...asset.metaTags, ...mergedTags]);
  return {
    id: asset.id,
    url: asset.url,
    filename: asset.filename,
    slug,
    category,
    shortId: asset.slug || asset.id,
    title,
    altText,
    metaTags: [...new Set([...asset.metaTags, ...mergedTags])],
    notes: asset.notes,
    byteSize: asset.byteSize,
    createdAt: asset.createdAt,
  };
}

export function galleryDetailPath(photo: GalleryPhoto, prefix = ''): string {
  return `${prefix}/gallery/image/${photo.category}/${photo.shortId}`;
}

export function isGalleryApiEnabled(): boolean {
  return Boolean(getAuthApiBaseUrl());
}

export async function fetchPublicGalleryPhotos(): Promise<GalleryPhoto[]> {
  if (!isGalleryApiEnabled()) return [];
  try {
    const data = await fetchPublic<{ assets: MediaAsset[] }>('/api/public/media');
    return (data.assets ?? []).map(mapAssetToGalleryPhoto);
  } catch {
    return [];
  }
}
