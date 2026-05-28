import type { GalleryAsset, GalleryPack, QueuedGalleryUpload } from '../types.js';
import type { CoverStudioHttpConfig } from './api.js';

const COVER_STUDIO_LIBRARY_PREFIX = '/api/cover-studio-library';

async function galleryFetch<T>(
  config: CoverStudioHttpConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = config.getBaseUrl().replace(/\/$/, '');
  if (!base) throw new Error('Cover Studio gallery API base URL is not set.');
  const auth = await config.getAuthHeaders();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...auth,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message ?? `Gallery request failed (${res.status})`);
  return data as T;
}

/** Cover Studio’s own library — not the site media_assets table. */
export function createGalleryClient(config: CoverStudioHttpConfig) {
  return {
    async listPacks(): Promise<GalleryPack[]> {
      const data = await galleryFetch<{ packs: GalleryPack[] }>(
        config,
        `${COVER_STUDIO_LIBRARY_PREFIX}`,
      );
      return data.packs ?? [];
    },

    async upload(
      files: QueuedGalleryUpload[],
      options?: { packId?: string; packTitle?: string },
    ): Promise<GalleryAsset[]> {
      const data = await galleryFetch<{ assets: GalleryAsset[] }>(
        config,
        `${COVER_STUDIO_LIBRARY_PREFIX}/upload`,
        {
          method: 'POST',
          body: JSON.stringify({
            files,
            packId: options?.packId,
            packTitle: options?.packTitle,
          }),
        },
      );
      return data.assets ?? [];
    },

    async removePack(packId: string): Promise<void> {
      await galleryFetch<{ ok: boolean }>(config, `${COVER_STUDIO_LIBRARY_PREFIX}/pack/${packId}`, {
        method: 'DELETE',
      });
    },
  };
}

export type GalleryClient = ReturnType<typeof createGalleryClient>;
