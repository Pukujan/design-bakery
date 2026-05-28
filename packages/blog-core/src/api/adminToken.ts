const STORAGE_KEY = 'blog_studio_admin_token';

let memoryToken: string | null = null;

export function getAuthApiBaseUrl(): string | null {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BLOG_API_URL) {
    const url = String(import.meta.env.VITE_BLOG_API_URL).trim();
    if (url) return url.replace(/\/$/, '');
  }
  return null;
}

export function getAdminAccessToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(STORAGE_KEY);
  }
  return null;
}

export function setAdminAccessToken(token: string | null): void {
  memoryToken = token;
  if (typeof sessionStorage !== 'undefined') {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  }
}
