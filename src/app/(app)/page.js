import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import PlayingSince from "@/components/PlayingSince/PlayingSince";
import Poster from "@/components/Poster/Poster";
import ResultBadge from "@/components/ResultBadge/ResultBadge";
import Skeleton from "@/components/Skeleton/Skeleton";
import Toast from "@/components/Toast/Toast";
import UserText, { GameName } from "@/components/UserText/UserText";
import { getProfile } from "@/lib/auth/session";
import { nameStyle } from "@/lib/character/items";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
import { monthHeadline, monthStartIso, monthStats, resultLabel } from "@/lib/stats/month";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default function Home({ searchParams }) {
  return (
    <main className={styles.main}>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

function HomeSkeleton() {
  return (
    <>
      <Skeleton height={320} radius={36} />
      <Skeleton height={180} radius={28} delay={120} />
    </>
  );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function HomeContent({ searchParams }) {
  const { saved } = await searchParams;
  const { profile, error } = await getProfile();

  // This month's sessions of the player, and the three latest sessions.
  const supabase = await createClient();
  const now = new Date();
  const [monthResult, recentResult, ratingResult] = profile
    ? await Promise.all([
        supabase
          .from("session_participants")
          .select("place, sessions!inner(played_at, session_participants(count))")
          .eq("profile_id", profile.id)
          .gte("sessions.played_at", monthStartIso(now)),
        supabase
          .from("sessions")
          .select(
            "id, played_at, games(name, created_by, type, emoji), session_participants(place, profile_id, profiles(nickname), guests(name))",
          )
          .order("played_at", { ascending: false })
          .limit(3),
        supabase
          .from("ratings")
          .select("rating, games_count, games(name, created_by, type, emoji)")
          .eq("profile_id", profile.id)
          .order("rating", { ascending: false })
          .limit(4),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const ratings = (ratingResult.data ?? []).map((row, index) => ({
    id: `${row.games?.name}-${index}`,
    game: <GameName game={row.games} />,
    emoji: gameEmoji(row.games),
    tone: findGameType(row.games?.type).tone,
    rating: Math.round(Number(row.rating)),
    games: row.games_count,
  }));

  const stats = monthStats(
    (monthResult.data ?? []).map((row) => ({
      place: row.place,
      participants: row.sessions.session_participants[0]?.count ?? 1,
    })),
  );
  const recent = (recentResult.data ?? []).map((session) => {
    const mine = session.session_participants.find(
      (p) => p.profile_id === profile.id,
    );
    const others = session.session_participants
      .filter((p) => p.profile_id !== profile.id)
      .map((p) => p.profiles?.nickname ?? p.guests?.name)
      .filter(Boolean);
    return {
      id: session.id,
      playedAt: session.played_at,
      game: <GameName game={session.games} />,
      emoji: gameEmoji(session.games),
      tone: findGameType(session.games?.type).tone,
      others,
      result: resultLabel(mine?.place ?? 0, session.session_participants.length),
      place: mine?.place ?? 0,
      players: session.session_participants.length,
    };
  });

  return (
    <>
      {saved && <Toast message="Session saved. Nice game." tone="success" dismissTo="/" />}
      <div className={`${styles.content} stagger`}>
      {error && (
        <p role="alert" className={styles.problem}>
          Could not load your profile: {error.message}
        </p>
      )}

      <Poster
        tone="ink"
        kicker={dateFormat.format(new Date())}
        headline={monthHeadline(stats)}
        face={stats.wins > 0 ? 6 : 3}
        className={styles.hero}
      >
        <div className={styles.panelTop}>
          <Avatar
            name={profile?.nickname}
            size={64}
            color="#ff4fa3"
            registered
            character={profile?.character}
            perks
          />
          <div className={styles.identity}>
            <div className={`${styles.name} ${nameStyle(profile?.character)}`}>
              <UserText>{profile?.nickname}</UserText>
            </div>
          </div>
          <Link
            href="/log"
            className={`${styles.logButton} btn-primary btn-tilt`}
            aria-label="Log a session"
          >
            <span>Log</span>
            <span className={styles.logPlus} aria-hidden="true">
              +
            </span>
          </Link>
        </div>

        <div className={styles.meta}>
          {profile?.created_at && <PlayingSince date={profile.created_at} />}
          {stats.played > 0 && (
            <>
              <span className={styles.metaLabel}>This month</span>
              <Chip tone="yellow">
                {stats.wins} {stats.wins === 1 ? "win" : "wins"}
              </Chip>
              <Chip tone="pink">
                {stats.played} {stats.played === 1 ? "session" : "sessions"}
              </Chip>
              {stats.winRate !== null && (
                <Chip tone="turquoise">{stats.winRate}% win rate</Chip>
              )}
            </>
          )}
        </div>
      </Poster>

      {ratings.length > 0 && (
        <section className={styles.card} aria-label="Your ratings">
          <div className={styles.cardTitle}>Your ratings</div>
          <ul className={styles.recent}>
            {ratings.map((item) => (
              <li key={item.id} className={styles.recentRow}>
                <span className={`${styles.tile} ${styles[`tile_${item.tone}`]}`}>
                  {item.emoji}
                </span>
                <span className={styles.recentText}>
                  <span className={styles.recentName}>{item.game}</span>
                  <span className={styles.recentChips}>
                    <Chip size="s">
                      {item.games} {item.games === 1 ? "game" : "games"}
                    </Chip>
                  </span>
                </span>
                <span className={styles.number}>
                  <span className={`${styles.mark} ${styles.markYellow}`}>
                    {item.rating}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className={styles.card} aria-label="Recent sessions">
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Recent</span>
            <Chip size="s" href="/history">
              All sessions
            </Chip>
          </div>
          <ul className={styles.recent}>
            {recent.map((session) => (
              <li key={session.id} className={styles.recentRow}>
                <span className={`${styles.tile} ${styles[`tile_${session.tone}`]}`}>
                  {session.emoji}
                </span>
                <span className={styles.recentText}>
                  <span className={styles.recentName}>{session.game}</span>
                  <span className={styles.recentChips}>
                    <Chip size="s">{shortDate.format(new Date(session.playedAt))}</Chip>
                    {session.others.slice(0, 2).map((name) => (
                      <Chip key={name} size="s">
                        <UserText>{name}</UserText>
                      </Chip>
                    ))}
                    {session.others.length > 2 && (
                      <Chip size="s">+{session.others.length - 2}</Chip>
                    )}
                  </span>
                </span>
                <span className={styles.resultChip}>
                  <ResultBadge
                    place={session.place}
                    players={session.players}
                    label={session.result}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      </div>
    </>
  );
}
