const TOKEN_KEY = 'design_bakery_admin_jwt';

/**
 * Resolve the configured API base. The literal `same-origin` means the API is served
 * from the site's own hostname (Caddy proxies /api/* to the Express container), so it
 * resolves to the current origin — no CORS, and correct on every hostname the site is
 * reached by (apex, www, a staging name).
 */
export function resolveApiBase(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value === 'same-origin') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return value.replace(/\/$/, '');
}

export function getAdminAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isBackendAdminAuthEnabled(): boolean {
  return Boolean(import.meta.env.VITE_BLOG_API_URL?.trim());
}

export function getAuthApiBaseUrl(): string | null {
  return resolveApiBase(import.meta.env.VITE_BLOG_API_URL);
}
