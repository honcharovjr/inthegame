import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import Skeleton from "@/components/Skeleton/Skeleton";
import { signOut } from "@/lib/auth/actions";
import { getProfile } from "@/lib/auth/session";
import { findGameType } from "@/lib/games/types";
import { monthStartIso, monthStats, resultLabel } from "@/lib/stats/month";
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
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

function HomeSkeleton() {
  return (
    <>
      <div className={styles.header}>
        <Skeleton width={150} height={14} />
        <Skeleton width={220} height={36} delay={80} style={{ marginTop: 8 }} />
      </div>
      <div className={styles.card}>
        <Skeleton width={96} height={96} radius={48} delay={160} />
        <div className={styles.identity}>
          <Skeleton width={140} height={30} delay={240} />
          <Skeleton width={170} height={28} radius={14} delay={320} />
        </div>
      </div>
      <Skeleton height={58} radius={29} delay={400} />
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
  const [monthResult, recentResult] = profile
    ? await Promise.all([
        supabase
          .from("session_participants")
          .select("place, sessions!inner(played_at, session_participants(count))")
          .eq("profile_id", profile.id)
          .gte("sessions.played_at", monthStartIso(now)),
        supabase
          .from("sessions")
          .select(
            "id, played_at, games(name, type), session_participants(place, profile_id, guests(name))",
          )
          .order("played_at", { ascending: false })
          .limit(3),
      ])
    : [{ data: [] }, { data: [] }];

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
      .filter((p) => !p.profile_id)
      .map((p) => p.guests?.name)
      .filter(Boolean);
    return {
      id: session.id,
      playedAt: session.played_at,
      game: session.games?.name ?? "Game",
      tone: findGameType(session.games?.type).tone,
      others,
      result: resultLabel(mine?.place ?? 0, session.session_participants.length),
      won: mine?.place === 1 && session.session_participants.length >= 2,
    };
  });

  return (
    <div className={`${styles.content} stagger`}>
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
          <Avatar name={profile?.nickname} size={84} color="#ff4fa3" />
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

      {saved && (
        <p role="status" className={styles.saved}>
          Session saved. Nice game.
        </p>
      )}

      <Link href="/log" className={styles.logButton}>
        <span>Log a session</span>
        <span className={styles.logPlus} aria-hidden="true">
          +
        </span>
      </Link>

      <section className={styles.card} aria-label="This month">
        <div className={styles.cardTitle}>This month</div>
        {stats.played === 0 ? (
          <Chip>No sessions yet this month</Chip>
        ) : (
          <div className={styles.numbers}>
            <div>
              <div className={styles.number}>
                <span className={`${styles.mark} ${styles.markYellow}`}>
                  {stats.wins}
                </span>
              </div>
              <div className={styles.numberLabel}>wins</div>
            </div>
            <div>
              <div className={styles.number}>
                <span className={`${styles.mark} ${styles.markPink}`}>
                  {stats.played}
                </span>
              </div>
              <div className={styles.numberLabel}>sessions</div>
            </div>
            <div>
              <div className={styles.number}>
                <span className={`${styles.mark} ${styles.markTurquoise}`}>
                  {stats.winRate === null ? "n/a" : `${stats.winRate}%`}
                </span>
              </div>
              <div className={styles.numberLabel}>win rate</div>
            </div>
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className={styles.card} aria-label="Recent sessions">
          <div className={styles.cardTitle}>Recent</div>
          <ul className={styles.recent}>
            {recent.map((session) => (
              <li key={session.id} className={styles.recentRow}>
                <span className={`${styles.tile} ${styles[`tile_${session.tone}`]}`}>
                  {session.game.charAt(0).toUpperCase()}
                </span>
                <span className={styles.recentText}>
                  <span className={styles.recentName}>{session.game}</span>
                  <span className={styles.recentChips}>
                    <Chip size="s">{shortDate.format(new Date(session.playedAt))}</Chip>
                    {session.others.slice(0, 2).map((name) => (
                      <Chip key={name} size="s">
                        {name}
                      </Chip>
                    ))}
                    {session.others.length > 2 && (
                      <Chip size="s">+{session.others.length - 2}</Chip>
                    )}
                  </span>
                </span>
                <Chip tone={session.won ? "pink" : "default"}>{session.result}</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Log out
        </button>
      </form>
    </div>
  );
}
