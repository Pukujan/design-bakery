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
  const explicit = process.env.CONTENT_BACKEND?.trim().toLowerCase();
  if (explicit === 'supabase') return isSupabaseConfigured();
  if (explicit === 'firebase') return false;
  return isSupabaseConfigured();
}

export function resolveImageStorageBackend(): 'supabase' | 'firebase' {
  const explicit = process.env.IMAGE_STORAGE?.trim().toLowerCase();
  if (explicit === 'supabase') return 'supabase';
  if (explicit === 'firebase') return 'firebase';
  if (isSupabaseStorageConfigured()) return 'supabase';
  return 'firebase';
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
