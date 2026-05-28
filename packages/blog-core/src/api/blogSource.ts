import { getAuthApiBaseUrl } from './adminToken.js';

export function isSupabaseDirectReadEnabled(): boolean {
  if (typeof import.meta === 'undefined') return false;
  return Boolean(
    import.meta.env?.VITE_SUPABASE_URL?.trim() && import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}

export function isPublicBlogSourceEnabled(): boolean {
  return isSupabaseDirectReadEnabled() || Boolean(getAuthApiBaseUrl());
}
