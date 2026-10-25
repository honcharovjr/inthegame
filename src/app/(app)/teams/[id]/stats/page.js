import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import BackButton from "@/components/BackButton/BackButton";
import Chip from "@/components/Chip/Chip";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireUser } from "@/lib/auth/session";
import { gameEmoji } from "@/lib/games/emoji";
import { playerColor } from "@/lib/sessions/colors";
import { teamGames } from "@/lib/stats/teamGames";
import { teamLeaderboard } from "@/lib/stats/leaderboard";
import { createClient } from "@/lib/supabase/server";
import styles from "../../teams.module.css";

export const metadata = { title: "Team stats" };

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
      .select("profile_id, profiles(nickname)")
      .eq("team_id", id),
    supabase
      .from("sessions")
      .select(
        "id, game_id, games(name, type, emoji), session_participants(place, profile_id)",
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
  const board = teamLeaderboard(
    shown.map((session) => ({
      participants: session.session_participants.map((p) => ({
        profileId: p.profile_id,
        place: p.place,
      })),
    })),
    members,
  );

  // Ratings exist per game, so they only show once one game is chosen.
  const ratings = new Map();
  if (game) {
    const { data } = await supabase
      .from("ratings")
      .select("profile_id, rating")
      .eq("game_id", game.id)
      .in("profile_id", members.map((member) => member.id));
    for (const row of data ?? []) {
      ratings.set(row.profile_id, Math.round(Number(row.rating)));
    }
  }

  const href = (gameId) =>
    gameId ? `/teams/${id}/stats?game=${gameId}` : `/teams/${id}/stats`;

  return (
    <div className={`${styles.body} stagger`}>
      <BackButton fallback={`/teams/${id}`} />
      <h1 className={styles.title}>{team.name} stats</h1>

      <div className={styles.chips} aria-label="Totals">
        <Chip tone="pink">
          {shown.length} {shown.length === 1 ? "session" : "sessions"}
        </Chip>
        <Chip tone="turquoise">
          {games.length} {games.length === 1 ? "game" : "games"}
        </Chip>
      </div>

      {games.length > 0 && (
        <div className={styles.gameChips} aria-label="Game">
          <Chip href={href("")} tone={game ? "white" : "active"}>
            All games
          </Chip>
          {games.map((item) => (
            <Chip
              key={item.id}
              href={href(item.id)}
              tone={game?.id === item.id ? "active" : "white"}
            >
              {gameEmoji(item)} {item.name}
            </Chip>
          ))}
        </div>
      )}

      <section className={styles.card} aria-label="Leaderboard">
        <div className={styles.cardTitle}>
          {game ? `Leaderboard in ${game.name}` : "Overall leaderboard"}
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
                      index === 0 && row.wins > 0
                        ? "var(--color-pink-deep)"
                        : undefined,
                  }}
                >
                  {index + 1}
                </span>
                <Avatar name={row.name} size={36} color={playerColor(index)} />
                <span className={styles.boardName}>{row.name}</span>
                <span className={styles.boardChips}>
                  <Chip size="s">
                    {row.games} {row.games === 1 ? "game" : "games"}
                  </Chip>
                  <Chip size="s" tone="pink">
                    {row.wins} {row.wins === 1 ? "win" : "wins"}
                  </Chip>
                  {row.winRate !== null && (
                    <Chip size="s" tone="turquoise">
                      {row.winRate}%
                    </Chip>
                  )}
                  {ratings.has(row.id) && (
                    <Chip size="s" tone="yellow">
                      {ratings.get(row.id)}
                    </Chip>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
