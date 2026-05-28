import { getAuthApiBaseUrl } from './adminToken.js';

function apiBase(): string {
  const base = getAuthApiBaseUrl();
  if (!base) throw new Error('VITE_BLOG_API_URL is not set for public content fetch.');
  return base;
}

export async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Public API ${path} failed (${res.status})`);
  }
  return data as T;
}
