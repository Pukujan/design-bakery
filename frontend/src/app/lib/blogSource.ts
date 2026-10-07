import { getAuthApiBaseUrl } from './adminToken';

/**
 * Browser-safe PostgREST read (anon key + RLS) against the legacy hosted Supabase.
 *
 * The data layer is now Octo, reached through the backend's /api/public/* routes
 * (TASK-DB-0074), so the direct read is only a fallback for builds with no backend
 * API configured. When VITE_BLOG_API_URL is set, the backend is authoritative —
 * otherwise a stale anon-key build would keep serving rows from the old database.
 */
export function isSupabaseDirectReadEnabled(): boolean {
  if (getAuthApiBaseUrl()) return false;
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Live blog content: the backend public API and/or a direct Supabase fallback. */
export function isPublicBlogSourceEnabled(): boolean {
  return Boolean(getAuthApiBaseUrl()) || isSupabaseDirectReadEnabled();
}
