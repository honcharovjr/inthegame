import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components (runs in the browser).
// The rest of the app imports this wrapper, never the Supabase package.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
