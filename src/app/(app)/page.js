import Link from "next/link";
import { Suspense } from "react";
import PageFrame, { PageTop } from "@/components/PageFrame/PageFrame";
import Skeleton from "@/components/Skeleton/Skeleton";
import { checkPlayer } from "@/lib/achievements/award";
import { getProfile } from "@/lib/auth/session";
import { activityCalendar } from "@/lib/stats/activity";
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
        <Link href="/games/play" className={`${styles.playButton} btn-secondary btn-tilt`}>
          Play
        </Link>
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

function HomeSkeleton() {
  return (
    <div className={styles.grid}>
      <Skeleton height={560} radius={36} />
      <Skeleton height={560} radius={28} delay={120} />
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
      .select("game_id, rating, games(name, created_by, type, emoji)")
      .eq("profile_id", profile.id)
      .order("games_count", { ascending: false })
      .limit(1),
  ]);

  // The rating of the game played most, with its last steps.
  const top = ratingResult.data?.[0] ?? null;
  const { data: history } = top
    ? await supabase
        .from("rating_history")
        .select("rating_after, created_at")
        .eq("profile_id", profile.id)
        .eq("game_id", top.game_id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };
  const trend = (history ?? []).map((row) => Number(row.rating_after)).reverse();

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
      top={top}
      trend={trend}
      timeline={timeline}
      rivals={rivals}
      progress={checkPlayer(profile.id).then(
        (check) => check.results,
        () => null,
      )}
    />
  );
}
