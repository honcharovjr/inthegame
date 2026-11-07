import { NextResponse } from "next/server";
import { linkTarget } from "@/lib/auth/next";
import { createClient } from "@/lib/supabase/server";

const TYPES = new Set(["email", "signup", "recovery", "email_change", "invite", "magiclink"]);

// Email links (confirm account, reset password) land here. The link carries
// its own token, so it works in any browser or device, not only the one the
// player signed up in. The email templates in Supabase point here.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const target = linkTarget(searchParams.get("next"), origin);

  if (tokenHash && TYPES.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${target}`);
    console.error("email link failed", error.code ?? error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
