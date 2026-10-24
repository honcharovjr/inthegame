import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user, or sends the visitor to the log in page.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  return user;
}
