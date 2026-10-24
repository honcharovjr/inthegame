import { Suspense } from "react";
import Character from "@/components/Character/Character";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <Character size={120} />
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>
    </main>
  );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function Greeting() {
  const user = await requireUser();
  const supabase = await createClient();

  // First real database read: the signed-in user's own profile.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <h1>Hello, {profile?.nickname ?? "player"}</h1>
      {error && (
        <p role="alert" className={styles.problem}>
          Could not load your profile: {error.message}
        </p>
      )}
      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Log out
        </button>
      </form>
    </>
  );
}
