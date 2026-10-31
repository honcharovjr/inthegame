import { createClient } from "@supabase/supabase-js";
import { cacheTag } from "next/cache";

export const SITE_SETTINGS_TAG = "site-settings";

const EMPTY = { operator_name: null, contact_email: null, minimum_age: null, privacy_updated_on: null };

// The site settings for the public pages (C31). Anyone may read them, so this
// uses the public key without a login and is cached until an admin saves new
// settings. Any error gives empty settings: the page still shows, with
// placeholders.
export async function getSiteSettings() {
  "use cache";
  cacheTag(SITE_SETTINGS_TAG);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return EMPTY;

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("site_settings")
    .select("operator_name, contact_email, minimum_age, privacy_updated_on")
    .maybeSingle();
  if (error) console.error("getSiteSettings failed", error);
  return data ?? EMPTY;
}
