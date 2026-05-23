const TOKEN_KEY = 'design_bakery_admin_jwt';

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
  const url = import.meta.env.VITE_BLOG_API_URL?.trim();
  if (!url) return null;
  return url.replace(/\/$/, '');
}
