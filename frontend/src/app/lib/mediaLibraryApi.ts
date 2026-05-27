import { getAuthApiBaseUrl } from './adminToken';

export type MediaAsset = {
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
  ocrRaw?: string;
  ocrModel?: string;
};

export type QueuedMediaUpload = {
  filename?: string;
  dataUrl: string;
  slug?: string;
  tags?: string[];
  altText?: string;
  notes?: string;
};

export type MediaOcrPreview = {
  filename: string;
  slug: string;
  tags: string[];
  rawFilename: string;
  rawTags: string;
  model: string;
};

async function mediaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getAuthApiBaseUrl();
  if (!base) throw new Error('VITE_BLOG_API_URL is not set.');
  const { getAdminAccessToken } = await import('./adminToken');
  const token = getAdminAccessToken();
  if (!token) throw new Error('Sign in to admin first.');

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(data.message ?? `Request failed (${res.status})`);
  return data as T;
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const data = await mediaFetch<{ assets: MediaAsset[] }>('/api/media-library');
  return data.assets ?? [];
}

export async function uploadMediaFiles(
  files: QueuedMediaUpload[],
): Promise<MediaAsset[]> {
  const data = await mediaFetch<{ assets: MediaAsset[] }>('/api/media-library/upload', {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
  return data.assets ?? [];
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
): Promise<MediaAsset> {
  const data = await mediaFetch<{ asset: MediaAsset }>(`/api/media-library/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data.asset;
}

export async function previewOcrForDataUrl(dataUrl: string): Promise<MediaOcrPreview> {
  const data = await mediaFetch<{ preview: MediaOcrPreview }>('/api/media-library/preview-ocr', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  });
  return data.preview;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await mediaFetch(`/api/media-library/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function ocrRenameMediaAsset(id: string): Promise<MediaAsset> {
  const data = await mediaFetch<{ asset: MediaAsset }>(
    `/api/media-library/${encodeURIComponent(id)}/ocr-filename`,
    { method: 'POST', body: '{}' },
  );
  return data.asset;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
