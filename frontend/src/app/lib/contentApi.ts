import { getAuthApiBaseUrl } from './adminToken';

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function isSupabaseContentEnabled(): boolean {
  return Boolean(getAuthApiBaseUrl());
}

function apiBase(): string {
  const base = getAuthApiBaseUrl();
  if (!base) throw new Error('VITE_BLOG_API_URL is not set.');
  return base;
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const { getAdminAccessToken } = await import('./adminToken');
  const token = getAdminAccessToken();
  if (!token) throw new Error('Sign in to admin first.');
  return fetchWithTimeout(`${apiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${apiBase()}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchContentArray<T>(collectionKey: string): Promise<T[]> {
  const enc = encodeURIComponent(collectionKey);
  const res = await authFetch(`/api/content/doc/${enc}/array`);
  const data = (await res.json()) as { items?: T[]; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'CMS read failed.');
  return data.items ?? [];
}

export async function fetchPublicContentArray<T>(collectionKey: string): Promise<T[]> {
  const enc = encodeURIComponent(collectionKey);
  const data = await fetchPublic<{ items?: T[] }>(`/api/public/doc/${enc}/array`);
  return data.items ?? [];
}

export async function saveContentArray(collectionKey: string, items: unknown[]): Promise<void> {
  const enc = encodeURIComponent(collectionKey);
  const res = await authFetch(`/api/content/doc/${enc}/array`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? 'CMS write failed.');
  }
}

export async function fetchContentObject<T>(collectionKey: string): Promise<T> {
  const enc = encodeURIComponent(collectionKey);
  const res = await authFetch(`/api/content/doc/${enc}/object`);
  const data = (await res.json()) as { item?: T; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'CMS read failed.');
  return data.item as T;
}

export async function fetchPublicContentObject<T>(collectionKey: string): Promise<T> {
  const enc = encodeURIComponent(collectionKey);
  const data = await fetchPublic<{ item?: T }>(`/api/public/doc/${enc}/object`);
  return data.item as T;
}

export async function saveContentObject(collectionKey: string, item: unknown): Promise<void> {
  const enc = encodeURIComponent(collectionKey);
  const res = await authFetch(`/api/content/doc/${enc}/object`, {
    method: 'PUT',
    body: JSON.stringify({ item }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? 'CMS write failed.');
  }
}

export async function fetchAdminBlogs(): Promise<unknown[]> {
  const res = await authFetch('/api/content/blogs');
  const data = (await res.json()) as { blogs?: unknown[]; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'Blog list failed.');
  return data.blogs ?? [];
}

export async function saveAdminBlog(post: unknown): Promise<string> {
  const body = post as { id?: string };
  const path = body.id ? `/api/content/blogs/${encodeURIComponent(body.id)}` : '/api/content/blogs';
  const res = await authFetch(path, {
    method: body.id ? 'PUT' : 'POST',
    body: JSON.stringify(post),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'Blog save failed.');
  return data.id ?? body.id ?? '';
}

export async function deleteAdminBlog(docId: string): Promise<void> {
  const res = await authFetch(`/api/content/blogs/${encodeURIComponent(docId)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? 'Blog delete failed.');
  }
}
