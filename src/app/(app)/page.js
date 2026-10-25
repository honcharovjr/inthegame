import { Suspense } from "react";
import Character from "@/components/Character/Character";
import Chip from "@/components/Chip/Chip";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

// Reads the session, so it streams in behind the Suspense boundary.
async function HomeContent() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nickname, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.date}>{dateFormat.format(new Date())}</div>
        <h1 className={styles.title}>Hey, {profile?.nickname ?? "player"}</h1>
      </header>

      {error && (
        <p role="alert" className={styles.problem}>
          Could not load your profile: {error.message}
        </p>
      )}

      <section className={styles.card} aria-label="Your character">
        <div className={styles.stage}>
          <div className={styles.stageShape} aria-hidden="true" />
          <Character size={84} color="#ff4fa3" />
        </div>
        <div className={styles.identity}>
          <div className={styles.name}>{profile?.nickname}</div>
          {profile?.created_at && (
            <Chip>
              Playing since {monthFormat.format(new Date(profile.created_at))}
            </Chip>
          )}
        </div>
      </section>

      {/* Becomes a link when the log flow ships. */}
      <div className={styles.logButton} aria-disabled="true">
        <span>Log a session</span>
        <span className={styles.logPlus} aria-hidden="true">
          +
        </span>
      </div>

      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Log out
        </button>
      </form>
    </>
  );
}
