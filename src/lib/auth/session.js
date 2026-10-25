import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user, or sends the visitor to the log in page.
// getClaims checks the signed login token on the server without a network
// call to Supabase Auth, so it is much faster than getUser. The proxy has
// already refreshed an expired token. Cached per request.
// Give a path to come back to after logging in, for example an invite link.
export const requireUser = cache(async (next) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return { id: claims.sub };
});

// The signed-in player's profile. Cached per request, so several parts of
// one page share a single database read.
export const getProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, character, created_at")
    .eq("user_id", user.id)
    .maybeSingle();
  return { profile: data, error };
});
