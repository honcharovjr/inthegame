import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import BackButton from "@/components/BackButton/BackButton";
import { FilterBody, FilterChip, FilterLoading } from "@/components/FilterLoading/FilterLoading";
import MetaLine from "@/components/MetaLine/MetaLine";
import UserText, { GameName } from "@/components/UserText/UserText";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireUser } from "@/lib/auth/session";
import { gameEmoji } from "@/lib/games/emoji";
import { playerColor } from "@/lib/sessions/colors";
import { memberRatings } from "@/lib/stats/average";
import { teamGames } from "@/lib/stats/teamGames";
import { teamLeaderboard } from "@/lib/stats/leaderboard";
import { createClient } from "@/lib/supabase/server";
import styles from "../../teams.module.css";

export const metadata = { title: "team stats" };

const UUID = /^[0-9a-f-]{36}$/i;

export default function TeamStatsPage({ params, searchParams }) {
  return (
    <main className={styles.page}>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function StatsSkeleton() {
  return (
    <div className={styles.body}>
      <Skeleton width={40} height={40} radius={20} />
      <Skeleton width={260} height={44} delay={60} />
      <Skeleton height={56} radius={22} delay={120} />
      <Skeleton height={260} radius={22} delay={200} />
    </div>
  );
}

// Reads the address, the session and the database, so it streams in.
async function StatsContent({ params, searchParams }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  await requireUser(`/teams/${id}/stats`);

  const query = await searchParams;
  const gameParam = UUID.test(String(query.game ?? "")) ? query.game : "";

  const supabase = await createClient();
  const [teamResult, membersResult, sessionsResult] = await Promise.all([
    supabase.from("teams").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("team_members")
      .select("profile_id, profiles(nickname, character)")
      .eq("team_id", id),
    supabase
      .from("sessions")
      .select(
        "id, game_id, games(name, created_by, type, emoji), session_participants(place, profile_id)",
      )
      .eq("team_id", id)
      .order("played_at", { ascending: false })
      .limit(500),
  ]);

  const team = teamResult.data;
  if (!team) notFound();

  const members = (membersResult.data ?? []).map((row) => ({
    id: row.profile_id,
    name: row.profiles?.nickname ?? "Player",
    character: row.profiles?.character ?? null,
  }));
  const sessions = sessionsResult.data ?? [];
  const games = teamGames(
    sessions.map((session) => ({ gameId: session.game_id, game: session.games })),
  );
  // An unknown game in the address falls back to all games.
  const game = games.find((item) => item.id === gameParam) ?? null;

  const shown = game
    ? sessions.filter((session) => session.game_id === game.id)
    : sessions;

  // The board ranks by rating (change C23): the game's rating once a game is
  // chosen, otherwise the overall rating. Both need 3 rated sessions.
  const { data: ratingRows } = await supabase
    .from("ratings")
    .select("profile_id, game_id, rating, games_count")
    .in("profile_id", members.map((member) => member.id))
    .match(game ? { game_id: game.id } : {});
  const ratings = memberRatings(ratingRows ?? [], Boolean(game));

  const board = teamLeaderboard(
    shown.map((session) => ({
      participants: session.session_participants.map((p) => ({
        profileId: p.profile_id,
        place: p.place,
      })),
    })),
    members,
    ratings,
  );

  const href = (gameId) =>
    gameId ? `/teams/${id}/stats?game=${gameId}` : `/teams/${id}/stats`;

  return (
    <FilterLoading>
    <div className={`${styles.body} stagger`}>
      <BackButton fallback={`/teams/${id}`} />
      <h1 className={styles.title}>
        <UserText>{team.name}</UserText> stats
      </h1>

      {games.length > 0 && (
        <div className={styles.gameChips} aria-label="Game">
          <FilterChip href={href("")} tone={game ? "white" : "active"}>
            All games
          </FilterChip>
          {games.map((item) => (
            <FilterChip
              key={item.id}
              href={href(item.id)}
              tone={game?.id === item.id ? "active" : "white"}
            >
              <span>
                {gameEmoji(item)} <GameName game={item} />
              </span>
            </FilterChip>
          ))}
        </div>
      )}

      <FilterBody skeleton={<Skeleton height={260} radius={22} />}>
      <div className={styles.totals} aria-label="Totals">
        <span>
          <strong>{shown.length}</strong> {shown.length === 1 ? "session" : "sessions"}
        </span>
        <span>
          <strong>{games.length}</strong> {games.length === 1 ? "game" : "games"}
        </span>
      </div>

      <section className={styles.card} aria-label="Leaderboard">
        <div className={styles.cardTitle}>
          {game ? <>Leaderboard in <GameName game={game} /></> : "Overall leaderboard"}
        </div>
        {shown.length === 0 ? (
          <p className={styles.empty}>No sessions logged in this team yet.</p>
        ) : (
          <ol className={styles.board}>
            {board.map((row, index) => (
              <li key={row.id} className={styles.boardRow}>
                <span
                  className={styles.rank}
                  style={{
                    color:
                      index === 0 && (row.rating !== null || row.wins > 0)
                        ? "var(--color-pink-deep)"
                        : undefined,
                  }}
                >
                  {index + 1}
                </span>
                <Avatar
                  name={row.name}
                  size={36}
                  color={playerColor(index)}
                  registered
                  character={members.find((m) => m.id === row.id)?.character}
                />
                <span className={`${styles.boardName} keep-case`}>{row.name}</span>
                <MetaLine
                  className={styles.boardMeta}
                  items={[
                    `${row.games} ${row.games === 1 ? "game" : "games"}`,
                    <span key="wins" className={styles.winner}>
                      {row.wins} {row.wins === 1 ? "win" : "wins"}
                    </span>,
                    row.winRate !== null && `${row.winRate}%`,
                    row.rating !== null && `rating ${row.rating}`,
                  ]}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
      </FilterBody>
    </div>
    </FilterLoading>
  );
}
