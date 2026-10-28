import BackButton from "@/components/BackButton/BackButton";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import UserText, { GameName } from "@/components/UserText/UserText";
import { FilterBody, FilterChip, FilterLoading } from "@/components/FilterLoading/FilterLoading";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
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
      `id, played_at, team_id, teams(id, name), games(name, created_by, type, emoji), session_participants(place, profile_id, profiles(nickname), guests(name))${
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
      game: <GameName game={session.games} />,
      teamId: session.team_id,
      // Null when the player has left the session's team.
      team: session.teams,
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

      {sessions.length > 0 && (
        <p className={styles.note}>
          To fix or delete a session, open its team or personal sessions.
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
                {!session.teamId ? (
                  <Chip size="s" tone="yellow" href="/teams/personal">
                    Personal
                  </Chip>
                ) : session.team ? (
                  <Chip size="s" tone="turquoise" href={`/teams/${session.team.id}`}>
                    <UserText>{session.team.name}</UserText>
                  </Chip>
                ) : (
                  <Chip size="s">Former team</Chip>
                )}
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
