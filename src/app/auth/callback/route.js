import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email links sent before the switch to /auth/confirm (Nov 2026) land here.
// They only work in the browser the player signed up in.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  // Only allow redirects inside the app.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
