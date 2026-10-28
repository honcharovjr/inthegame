import { notFound, unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// True when the logged-in user is a super admin. Never redirects, so the
// menu can ask on any page. Any error, such as no login, counts as no.
export const isSuperAdmin = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims?.sub) return false;
    const { data, error } = await supabase.rpc("is_super_admin");
    return !error && data === true;
  } catch (error) {
    // Lets Next.js handle its own signals, such as a page that must render
    // per request, and treats real failures as "not an admin".
    unstable_rethrow(error);
    console.error("isSuperAdmin failed", error);
    return false;
  }
});

// For admin pages: the admin's profile, or a 404 for everyone else, so the
// panel does not reveal that it exists.
export async function requireSuperAdmin() {
  const { profile } = await getProfile();
  if (!profile || !(await isSuperAdmin())) notFound();
  return profile;
}

// For admin actions: the admin's profile, or null.
export async function adminProfile() {
  const { profile } = await getProfile();
  return profile && (await isSuperAdmin()) ? profile : null;
}
