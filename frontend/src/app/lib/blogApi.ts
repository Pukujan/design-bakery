import { getAdminAccessToken } from '@/lib/adminToken';

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
  const token = getAdminAccessToken();
  if (!token) {
    throw new Error('Sign in to admin before using blog AI tools.');
  }
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const hint = e instanceof Error ? e.message : 'Network error';
    const pageOrigin =
      typeof window !== 'undefined' ? window.location.origin : '';
    if (/localhost|127\.0\.0\.1/.test(base) && pageOrigin && !/localhost|127\.0\.0\.1/.test(pageOrigin)) {
      throw new Error(
        `Failed to fetch — this site is on ${pageOrigin} but VITE_BLOG_API_URL points at ${base}. ` +
          'On Vercel set VITE_BLOG_API_URL to your Railway HTTPS URL and redeploy.',
      );
    }
    throw new Error(
      `Failed to reach blog API at ${base} (${hint}). ` +
        'Local: run pnpm run dev:stack, open the URL Vite prints, confirm http://localhost:8787/health works.',
    );
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 200);
      throw new Error(
        `API returned non-JSON (${res.status}). Check VITE_BLOG_API_URL points at your Railway/backend URL. Response: ${snippet || '(empty)'}`,
      );
    }
  }

  if (!res.ok) {
    const err = data as { message?: string; code?: string; ok?: boolean };
    const msg =
      err?.message ??
      (res.status === 404
        ? 'API route not found — is the backend deployed and is VITE_BLOG_API_URL correct?'
        : `Request failed (${res.status})`);
    throw Object.assign(new Error(msg), { status: res.status, code: err?.code });
  }

  return data as TResponse;
}
