import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars aren't present (common in misconfigured Preview builds),
  // return null instead of crashing the build.
  if (!url || !key) return null;

  _client = createClient(url, key);
  return _client;
}
