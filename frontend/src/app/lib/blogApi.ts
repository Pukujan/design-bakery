import { auth } from '@/lib/firebase';

/** Express API on Railway (or local `pnpm run dev:api`). When set, skips Firebase callables. */
export function getBlogApiBaseUrl(): string | null {
  const url = import.meta.env.VITE_BLOG_API_URL?.trim();
  if (!url) return null;
  return url.replace(/\/$/, '');
}

export function isBlogApiEnabled(): boolean {
  return Boolean(getBlogApiBaseUrl());
}

export async function postBlogApi<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const base = getBlogApiBaseUrl();
  if (!base) {
    throw new Error('VITE_BLOG_API_URL is not set.');
  }
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('Sign in to admin before using blog AI tools.');
  }
  const token = await user.getIdToken();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  let data: unknown;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`API returned invalid JSON (${res.status}).`);
  }

  if (!res.ok) {
    const err = data as { message?: string; code?: string };
    const msg = err?.message ?? `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status, code: err?.code });
  }

  return data as TResponse;
}
