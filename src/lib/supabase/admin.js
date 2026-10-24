import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Supabase client with the service role key. It bypasses Row Level Security.
// Use only in server-side code, for example to write ratings.
// Never import this file from a Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
