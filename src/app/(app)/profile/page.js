import { Suspense } from "react";
import PageFrame, { PageTop } from "@/components/PageFrame/PageFrame";
import Skeleton from "@/components/Skeleton/Skeleton";
import { checkPlayer } from "@/lib/achievements/award";
import { getProfile } from "@/lib/auth/session";
import { monthStats } from "@/lib/stats/month";
import { playerStats } from "@/lib/stats/player";
import { loadResults } from "@/lib/stats/results";
import { createClient } from "@/lib/supabase/server";
import ProfileView from "./ProfileView";
import styles from "./profile.module.css";

export const metadata = { title: "profile" };

// How many games the rating chart compares.
const CHART_GAMES = 3;

export default function ProfilePage({ searchParams }) {
  return (
    <PageFrame>
      <PageTop title="Profile" />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent searchParams={searchParams} />
      </Suspense>
    </PageFrame>
  );
}

function ProfileSkeleton() {
  return (
    <div className={styles.skeleton}>
      <Skeleton height={640} radius={36} />
      <Skeleton height={640} radius={36} delay={120} />
    </div>
  );
}

// Reads the session and the database, so it streams in behind Suspense.
async function ProfileContent({ searchParams }) {
  const { mode } = await searchParams;
  const { profile } = await getProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const [{ data: guests }, results, { data: ratingRows }, progress] = await Promise.all([
    supabase.from("guests").select("id, name").eq("owner_id", profile.id).order("created_at"),
    loadResults(supabase, profile.id, { withGames: true }),
    supabase
      .from("ratings")
      .select("game_id, rating, games_count, games(name, created_by, type, emoji)")
      .eq("profile_id", profile.id)
      .order("games_count", { ascending: false }),
    // Brings the achievements up to date first, so items earned a moment ago are open.
    checkPlayer(profile.id).then(
      (check) => check.results,
      () => [],
    ),
  ]);

  const totals = monthStats(results.rows);
  const { games: gameStats } = playerStats(results.rows);
  const ratingOf = new Map((ratingRows ?? []).map((row) => [row.game_id, Math.round(Number(row.rating))]));
  const earned = progress.filter((row) => row.earned).map((row) => row.code);

  // The rating of the games played most, step by step.
  const chartGames = (ratingRows ?? []).slice(0, CHART_GAMES);
  const { data: history } = chartGames.length
    ? await supabase
        .from("rating_history")
        .select("game_id, rating_after, created_at")
        .eq("profile_id", profile.id)
        .in("game_id", chartGames.map((row) => row.game_id))
        .order("created_at")
    : { data: [] };
  const series = chartGames.map((row) => ({
    game: row.games,
    rating: Math.round(Number(row.rating)),
    values: (history ?? []).filter((h) => h.game_id === row.game_id).map((h) => Number(h.rating_after)),
  }));

  return (
    <ProfileView
      profile={profile}
      startOnLook={mode === "look"}
      totals={totals}
      gameStats={gameStats}
      statsError={results.error}
      ratingOf={ratingOf}
      earned={earned}
      series={series}
      guests={guests ?? []}
    />
  );
}
