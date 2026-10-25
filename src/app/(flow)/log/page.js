import { Suspense } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import LogFlow from "./LogFlow";
import styles from "./flow.module.css";

export const metadata = { title: "Log a session" };

export default function LogPage() {
  return (
    <Suspense fallback={<LogSkeleton />}>
      <LogData />
    </Suspense>
  );
}

// Loads everything the three steps need in one go, in parallel, so the steps
// themselves never wait for the network.
async function LogData() {
  const { profile } = await getProfile();
  const supabase = await createClient();

  const [gamesResult, guestsResult, recentResult] = await Promise.all([
    supabase
      .from("games")
      .select(
        "id, name, type, is_classic, min_players, max_players, typical_duration_min",
      )
      .order("name"),
    supabase
      .from("guests")
      .select("id, name")
      .eq("owner_id", profile?.id)
      .order("created_at"),
    supabase
      .from("sessions")
      .select("game_id")
      .order("played_at", { ascending: false })
      .limit(30),
  ]);

  if (!profile || gamesResult.error) {
    return (
      <main className={styles.fallback}>
        <p role="alert" className={styles.message}>
          Could not load the log flow. Reload the page.
        </p>
      </main>
    );
  }

  // The player's latest games, newest first, without repeats.
  const recentGameIds = [
    ...new Set((recentResult.data ?? []).map((row) => row.game_id)),
  ].slice(0, 4);

  return (
    <LogFlow
      profile={{ id: profile.id, nickname: profile.nickname }}
      games={gamesResult.data}
      initialGuests={guestsResult.data ?? []}
      recentGameIds={recentGameIds}
    />
  );
}

function LogSkeleton() {
  return (
    <main className={styles.skeletonPage}>
      <div className={styles.skeletonColumn}>
        <Skeleton tone="light" width={44} height={44} radius={22} />
        <Skeleton tone="light" height={6} radius={3} />
        <Skeleton tone="light" width={220} height={110} radius={20} />
        <Skeleton tone="light" height={54} radius={27} />
        <Skeleton tone="light" height={78} radius={24} />
        <Skeleton tone="light" height={78} radius={24} />
        <Skeleton tone="light" height={78} radius={24} />
      </div>
    </main>
  );
}
