import Link from "next/link";
import { Suspense } from "react";
import PageFrame, { PageTop } from "@/components/PageFrame/PageFrame";
import Skeleton from "@/components/Skeleton/Skeleton";
import { checkPlayer } from "@/lib/achievements/award";
import { getProfile } from "@/lib/auth/session";
import { activityCalendar } from "@/lib/stats/activity";
import { countedGames, overallRating } from "@/lib/stats/average";
import { monthStats, resultLabel } from "@/lib/stats/month";
import { loadResults } from "@/lib/stats/results";
import { headToHead } from "@/lib/stats/rivals";
import { winStreaks } from "@/lib/stats/streak";
import { createClient } from "@/lib/supabase/server";
import HomeView from "./HomeView";
import styles from "./page.module.css";

export default function Home({ searchParams }) {
  return (
    <PageFrame>
      <PageTop title="Home">
        <Link href="/log" className={`${styles.logButton} btn-primary btn-tilt`} aria-label="Log a session">
          <span>Log</span>
          <span className={styles.logPlus} aria-hidden="true">
            +
          </span>
        </Link>
      </PageTop>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </PageFrame>
  );
}

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

// How many sessions the rivals are counted from.
const RIVAL_SESSIONS = 200;

// The shape of Home: the card, then the rating, streak and activity beside it.
function HomeSkeleton() {
  return (
    <div className={styles.grid}>
      <div className={styles.skeletonCard}>
        <Skeleton height={560} radius={36} />
      </div>
      <div className={styles.side}>
        <div className={styles.pair}>
          <Skeleton height={200} radius={24} delay={120} />
          <Skeleton height={200} radius={24} delay={180} />
        </div>
        <Skeleton height={220} radius={24} delay={240} />
      </div>
    </div>
  );
}

const personKey = (p) => (p.profile_id ? `p:${p.profile_id}` : `g:${p.guest_id}`);

// Reads the session, so it streams in behind the Suspense boundary.
async function HomeContent({ searchParams }) {
  const { saved } = await searchParams;
  const { profile, error } = await getProfile();
  if (!profile) {
    return error ? (
      <p role="alert" className={styles.problem}>
        Could not load your profile: {error.message}
      </p>
    ) : null;
  }

  const supabase = await createClient();
  const [results, sessionsResult, ratingResult] = await Promise.all([
    loadResults(supabase, profile.id),
    supabase
      .from("sessions")
      .select(
        "id, played_at, games(name, created_by, type, emoji), session_participants(place, profile_id, guest_id, profiles(nickname, character), guests(name)), mine:session_participants!inner(profile_id)",
      )
      .eq("mine.profile_id", profile.id)
      .order("played_at", { ascending: false })
      .limit(RIVAL_SESSIONS),
    supabase
      .from("ratings")
      .select("game_id, rating, games_count, games(name, created_by, type, emoji)")
      .eq("profile_id", profile.id)
      .order("games_count", { ascending: false }),
  ]);

  // One rating for the player: the weighted average over games with enough
  // rated sessions (change C23).
  const ratingRows = ratingResult.data ?? [];
  const rating = {
    games: ratingRows,
    average: overallRating(ratingRows),
    counted: countedGames(ratingRows).length,
  };

  const totals = monthStats(results.rows);
  const streak = winStreaks(results.rows);
  const calendar = activityCalendar(
    results.rows.map((row) => row.playedAt),
    new Date(),
  );

  const me = `p:${profile.id}`;
  const sessions = sessionsResult.data ?? [];
  const rivals = headToHead(
    sessions.map((session) => ({
      participants: session.session_participants.map((p) => ({
        key: personKey(p),
        place: p.place,
        name: p.profiles?.nickname ?? p.guests?.name ?? "Player",
        registered: Boolean(p.profile_id),
        character: p.profiles?.character ?? null,
      })),
    })),
    me,
  );
  const timeline = sessions.slice(0, 4).map((session) => {
    const mine = session.session_participants.find((p) => personKey(p) === me);
    const players = session.session_participants.length;
    return {
      id: session.id,
      game: session.games,
      date: shortDate.format(new Date(session.played_at)),
      label: resultLabel(mine?.place ?? 0, players),
      tone: players < 2 ? "solo" : mine?.place === 1 ? "won" : "other",
    };
  });

  return (
    <HomeView
      saved={saved}
      profile={profile}
      totals={totals}
      streak={streak.current}
      calendar={calendar}
      rating={rating}
      timeline={timeline}
      rivals={rivals}
      progress={checkPlayer(profile.id).then(
        (check) => check.results,
        () => null,
      )}
    />
  );
}
