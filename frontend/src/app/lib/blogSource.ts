import { getAuthApiBaseUrl } from './adminToken';

/** Browser-safe PostgREST read (anon key + RLS). Fastest path for public blog pages. */
export function isSupabaseDirectReadEnabled(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Live blog content: direct Supabase and/or Railway public API. */
export function isPublicBlogSourceEnabled(): boolean {
  return isSupabaseDirectReadEnabled() || Boolean(getAuthApiBaseUrl());
}
