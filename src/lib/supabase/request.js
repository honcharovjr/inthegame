import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";
import { createClient } from "./server";

// The profile id of whoever sent a request to a route, or null. Accepts a
// login token in the Authorization header, which future store apps will
// send, or the browser's login cookies. getClaims verifies the token.
export async function callerProfileId(request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  const supabase = token
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      )
    : await createClient();
  const { data, error } = await supabase.auth.getClaims(token ?? undefined);
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return profile?.id ?? null;
}
