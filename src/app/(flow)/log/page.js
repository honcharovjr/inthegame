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

  const [gamesResult, guestsResult, recentResult, teamsResult] = await Promise.all([
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
      .select("game_id, team_id, session_participants(guest_id, profile_id)")
      .order("played_at", { ascending: false })
      .limit(30),
    supabase
      .from("team_members")
      .select("teams(id, name, team_members(profile_id, profiles(nickname)))")
      .eq("profile_id", profile?.id),
  ]);

  // The teams of the player, each with its members.
  const teams = (teamsResult.data ?? [])
    .filter((row) => row.teams)
    .map((row) => ({
      id: row.teams.id,
      name: row.teams.name,
      members: row.teams.team_members.map((member) => ({
        id: member.profile_id,
        nickname: member.profiles?.nickname ?? "Player",
      })),
    }));

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

  // The latest session, so the flow can offer to play it again.
  const latest = recentResult.data?.[0];
  const lastSession = latest
    ? {
        gameId: latest.game_id,
        teamId: latest.team_id,
        memberIds: latest.session_participants
          .map((p) => p.profile_id)
          .filter((id) => id && id !== profile.id),
        guestIds: latest.session_participants
          .map((p) => p.guest_id)
          .filter(Boolean),
      }
    : null;

  return (
    <LogFlow
      profile={{ id: profile.id, nickname: profile.nickname }}
      games={gamesResult.data}
      initialGuests={guestsResult.data ?? []}
      teams={teams}
      recentGameIds={recentGameIds}
      lastSession={lastSession}
    />
  );
}

function LogSkeleton() {
  return (
    <main className={styles.skeletonPage}>
      <div className={styles.skeletonColumn}>
        <Skeleton tone="light" width={44} height={44} radius={22} />
        <Skeleton tone="light" height={6} radius={3} delay={60} />
        <Skeleton tone="light" width={220} height={110} radius={20} delay={120} />
        <Skeleton tone="light" height={54} radius={27} delay={200} />
        <Skeleton tone="light" height={78} radius={24} delay={280} />
        <Skeleton tone="light" height={78} radius={24} delay={360} />
        <Skeleton tone="light" height={78} radius={24} delay={440} />
      </div>
    </main>
  );
}
