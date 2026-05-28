import { getAdminAccessToken } from './adminToken.js';

export function getBlogApiBaseUrl(): string | null {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BLOG_API_URL) {
    const url = String(import.meta.env.VITE_BLOG_API_URL).trim();
    if (url) return url.replace(/\/$/, '');
  }
  return null;
}

export function isBlogApiEnabled(): boolean {
  return Boolean(getBlogApiBaseUrl());
}

export async function postBlogApi<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const base = getBlogApiBaseUrl();
  if (!base) {
    throw new Error('VITE_BLOG_API_URL is not set.');
  }
  const token = getAdminAccessToken();
  if (!token) {
    throw new Error('Sign in before using blog AI tools.');
  }
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`API returned non-JSON (${res.status}).`);
    }
  }
  if (!res.ok) {
    const err = data as { message?: string };
    throw new Error(err?.message ?? `Request failed (${res.status})`);
  }
  return data as TResponse;
}
