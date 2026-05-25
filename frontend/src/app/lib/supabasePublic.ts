import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseDirectReadEnabled } from './blogSource';

let client: SupabaseClient | null = null;

export function getSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseDirectReadEnabled()) return null;
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL!.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!.trim();
  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
