import Link from "next/link";
import BackButton from "@/components/BackButton/BackButton";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import UserText, { GameName } from "@/components/UserText/UserText";
import { FilterBody, FilterChip, FilterLoading } from "@/components/FilterLoading/FilterLoading";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { PenIcon } from "@/components/icons";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
import { deleteSession } from "@/lib/sessions/actions";
import { resultLabel } from "@/lib/stats/month";
import { createClient } from "@/lib/supabase/server";
import HistoryFilters from "./HistoryFilters";
import styles from "./history.module.css";

export const metadata = { title: "history" };

const PAGE_SIZE = 20;
const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function readFilters(params) {
  return {
    game: UUID.test(String(params.game ?? "")) ? params.game : "",
    from: DATE.test(String(params.from ?? "")) ? params.from : "",
    to: DATE.test(String(params.to ?? "")) ? params.to : "",
    result: ["won", "lost"].includes(params.result) ? params.result : "",
  };
}

function pageHref(filters, page) {
  const query = new URLSearchParams();
  if (filters.game) query.set("game", filters.game);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.result) query.set("result", filters.result);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/history?${text}` : "/history";
}

export default function HistoryPage({ searchParams }) {
  return (
    <main className={styles.page}>
      <BackButton fallback="/" />
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

  const filters = readFilters(params);
  const { profile } = await getProfile();
  const supabase = await createClient();

  // To filter by your own result, the sessions are matched on your own row of
  // participants, a second view of the same table next to the one shown.
  const byResult = Boolean(filters.result);
  let query = supabase
    .from("sessions")
    .select(
      `id, played_at, created_by, games(name, created_by, type, emoji), session_participants(place, profile_id, profiles(nickname), guests(name))${
        byResult ? ", mine:session_participants!inner(place)" : ""
      }`,
      { count: "exact" },
    )
    .order("played_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filters.game) query = query.eq("game_id", filters.game);
  if (filters.from) query = query.gte("played_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) query = query.lte("played_at", `${filters.to}T23:59:59.999Z`);
  if (byResult && profile) {
    query = query.eq("mine.profile_id", profile.id);
    query = filters.result === "won" ? query.eq("mine.place", 1) : query.neq("mine.place", 1);
  }

  const [{ data, count, error }, gamesResult] = await Promise.all([
    query,
    supabase.from("games").select("id, name, created_by").order("name"),
  ]);
  const filtered = Object.values(filters).some(Boolean);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const sessions = (data ?? []).map((session) => {
    const people = session.session_participants;
    const mine = people.find((p) => p.profile_id === profile?.id);
    return {
      id: session.id,
      playedAt: session.played_at,
      mine: session.created_by === profile?.id,
      game: <GameName game={session.games} />,
      gameText: session.games?.name ?? "Game",
      emoji: gameEmoji(session.games),
      tone: findGameType(session.games?.type).tone,
      others: people
        .filter((p) => p.profile_id !== profile?.id)
        .map((p) => p.profiles?.nickname ?? p.guests?.name),
      result: resultLabel(mine?.place ?? 0, people.length),
      won: mine?.place === 1 && people.length >= 2,
    };
  });

  return (
    <FilterLoading>
    <div className={styles.body}>
      <HistoryFilters games={gamesResult.data ?? []} filters={filters} />

      <FilterBody skeleton={<HistorySkeleton />}>
      {error && (
        <p role="alert" className={styles.problem}>
          Could not load your history: {error.message}
        </p>
      )}

      {!error && sessions.length === 0 && (
        <p className={styles.empty}>
          {filtered
            ? "No sessions match these filters."
            : "No sessions yet. Log your first one from Home."}
        </p>
      )}

      <ul className={`${styles.list} stagger`}>
        {sessions.map((session) => (
          <li key={session.id} className={styles.row}>
            <span className={`${styles.tile} ${styles[`tile_${session.tone}`]}`}>
              {session.emoji}
            </span>
            <span className={styles.text}>
              <span className={styles.name}>{session.game}</span>
              <span className={styles.chips}>
                <Chip size="s">{dateFormat.format(new Date(session.playedAt))}</Chip>
                {session.others.filter(Boolean).map((name) => (
                  <Chip key={name} size="s">
                    <UserText>{name}</UserText>
                  </Chip>
                ))}
              </span>
            </span>
            <span className={styles.side}>
              <Chip tone={session.won ? "pink" : "default"}>{session.result}</Chip>
              {session.mine && (
                <Link
                  href={`/log?edit=${session.id}`}
                  className={styles.edit}
                  aria-label={`Edit the ${session.gameText} session`}
                  data-tip="Edit"
                  data-tip-align="end"
                >
                  <PenIcon size={17} />
                </Link>
              )}
              {session.mine && (
                <ConfirmButton
                  title="Delete this session?"
                  message={
                    <>
                      {session.game} on {dateFormat.format(new Date(session.playedAt))} will be
                      removed and your ratings will be recalculated.
                    </>
                  }
                  confirmLabel="Delete session"
                  ariaLabel={`Delete the ${session.gameText} session`}
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
            <FilterChip href={pageHref(filters, page - 1)}>Previous</FilterChip>
          )}
          <Chip tone="pink">
            Page {page} of {totalPages}
          </Chip>
          {page < totalPages && (
            <FilterChip href={pageHref(filters, page + 1)}>Next</FilterChip>
          )}
        </nav>
      )}
      </FilterBody>
    </div>
    </FilterLoading>
  );
}
