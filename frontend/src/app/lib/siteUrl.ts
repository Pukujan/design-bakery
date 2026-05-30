const DEFAULT_SITE_ORIGIN = 'https://www.design-bakery.com';

/** Production canonical origin — prefers VITE_SITE_URL, then browser origin in dev. */
export function resolveSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return DEFAULT_SITE_ORIGIN;
}

export function toAbsoluteSiteUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (!value) return resolveSiteOrigin();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const origin = resolveSiteOrigin();
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

export { DEFAULT_SITE_ORIGIN };
