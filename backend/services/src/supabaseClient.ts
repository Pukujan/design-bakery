import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && process.env.SUPABASE_STORAGE_BUCKET?.trim());
}

export function isSupabaseContentBackend(): boolean {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase CMS is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
    );
  }
  return true;
}

export function resolveImageStorageBackend(): 'supabase' {
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      'Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET in backend/.env.',
    );
  }
  return 'supabase';
}

export function supabaseStorageBucket(): string {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error('SUPABASE_STORAGE_BUCKET is missing in backend/.env');
  }
  return bucket;
}

/** Server-side Supabase client (service role — never expose to the browser). */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
    );
  }
  if (!adminClient) {
    adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}
