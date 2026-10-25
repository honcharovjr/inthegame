import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { findGameType } from "@/lib/games/types";
import { deleteSession } from "@/lib/sessions/actions";
import { resultLabel } from "@/lib/stats/month";
import { createClient } from "@/lib/supabase/server";
import styles from "./history.module.css";

export const metadata = { title: "History" };

const PAGE_SIZE = 20;

export default function HistoryPage({ searchParams }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>History</h1>
      <Suspense fallback={<HistorySkeleton />}>
        <HistoryList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function HistorySkeleton() {
  return (
    <div className={styles.skeletons}>
      <Skeleton height={76} radius={22} />
      <Skeleton height={76} radius={22} delay={80} />
      <Skeleton height={76} radius={22} delay={160} />
      <Skeleton height={76} radius={22} delay={240} />
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Reads the URL query and the database, so it streams in behind Suspense.
async function HistoryList({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { profile } = await getProfile();
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("sessions")
    .select(
      "id, played_at, created_by, games(name, type), session_participants(place, profile_id, guests(name))",
      { count: "exact" },
    )
    .order("played_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const sessions = (data ?? []).map((session) => {
    const people = session.session_participants;
    const mine = people.find((p) => p.profile_id === profile?.id);
    return {
      id: session.id,
      playedAt: session.played_at,
      mine: session.created_by === profile?.id,
      game: session.games?.name ?? "Game",
      tone: findGameType(session.games?.type).tone,
      others: people.filter((p) => !p.profile_id).map((p) => p.guests?.name),
      result: resultLabel(mine?.place ?? 0, people.length),
      won: mine?.place === 1 && people.length >= 2,
    };
  });

  return (
    <div className={styles.body}>
      {error && (
        <p role="alert" className={styles.problem}>
          Could not load your history: {error.message}
        </p>
      )}

      {!error && sessions.length === 0 && (
        <p className={styles.empty}>
          No sessions yet. Log your first one from Home.
        </p>
      )}

      <ul className={`${styles.list} stagger`}>
        {sessions.map((session) => (
          <li key={session.id} className={styles.row}>
            <span className={`${styles.tile} ${styles[`tile_${session.tone}`]}`}>
              {session.game.charAt(0).toUpperCase()}
            </span>
            <span className={styles.text}>
              <span className={styles.name}>{session.game}</span>
              <span className={styles.chips}>
                <Chip size="s">{dateFormat.format(new Date(session.playedAt))}</Chip>
                {session.others.filter(Boolean).map((name) => (
                  <Chip key={name} size="s">
                    {name}
                  </Chip>
                ))}
              </span>
            </span>
            <span className={styles.side}>
              <Chip tone={session.won ? "pink" : "default"}>{session.result}</Chip>
              {session.mine && (
                <ConfirmButton
                  label="Delete"
                  confirmLabel="Yes, delete"
                  action={deleteSession.bind(null, session.id)}
                />
              )}
            </span>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className={styles.pager} aria-label="Pages">
          {page > 1 && (
            <Chip href={page === 2 ? "/history" : `/history?page=${page - 1}`}>
              Previous
            </Chip>
          )}
          <Chip tone="pink">
            Page {page} of {totalPages}
          </Chip>
          {page < totalPages && (
            <Chip href={`/history?page=${page + 1}`}>Next</Chip>
          )}
        </nav>
      )}
    </div>
  );
}
