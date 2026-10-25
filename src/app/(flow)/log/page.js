import Link from "next/link";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import FlowShell from "@/components/FlowShell/FlowShell";
import { ClockIcon, UsersIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { findGameType } from "@/lib/games/types";
import { createClient } from "@/lib/supabase/server";
import styles from "./flow.module.css";

export const metadata = { title: "Log a session" };

const LIST_LIMIT = 30;

export default function LogGamePage({ searchParams }) {
  return (
    <FlowShell step={1} tone="turquoise" backHref="/" headline={"Which\ngame?"}>
      <Suspense fallback={null}>
        <GameChooser searchParams={searchParams} />
      </Suspense>
    </FlowShell>
  );
}

function formatPlayers(game) {
  return game.min_players === game.max_players
    ? `${game.min_players}`
    : `${game.min_players}-${game.max_players}`;
}

function toneClass(tone) {
  return styles[`tile${tone.charAt(0).toUpperCase()}${tone.slice(1)}`];
}

// Reads the URL query and the database, so it streams in behind Suspense.
async function GameChooser({ searchParams }) {
  await requireUser();
  const params = await searchParams;
  const q = String(params.q ?? "").trim().slice(0, 60);

  const supabase = await createClient();
  let query = supabase
    .from("games")
    .select("id, name, type, is_classic, min_players, max_players, typical_duration_min")
    .order("name")
    .limit(LIST_LIMIT);
  if (q) {
    query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  }

  // The player's latest games, newest first, without repeats.
  const recentQuery = q
    ? null
    : supabase
        .from("sessions")
        .select("games ( id, name )")
        .order("played_at", { ascending: false })
        .limit(30);

  const [{ data: games, error }, recent] = await Promise.all([
    query,
    recentQuery,
  ]);

  const seen = new Set();
  const recentGames = (recent?.data ?? [])
    .map((row) => row.games)
    .filter((game) => game && !seen.has(game.id) && seen.add(game.id))
    .slice(0, 4);

  return (
    <>
      <form method="get" role="search" className={styles.search}>
        <input
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search games"
          aria-label="Search games"
        />
      </form>

      {recentGames.length > 0 && (
        <div className={styles.chips} aria-label="Recent games">
          <Chip tone="white">Recent</Chip>
          {recentGames.map((game) => (
            <Chip
              key={game.id}
              tone="white"
              href={`/log/players?game=${game.id}`}
            >
              {game.name}
            </Chip>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className={styles.message}>
          Could not load games: {error.message}
        </p>
      )}

      {games?.length === 0 && (
        <p className={styles.message}>No games match this search.</p>
      )}

      <ul className={styles.list}>
        {games?.map((game) => {
          const type = findGameType(game.type);
          return (
            <li key={game.id}>
              <Link
                href={`/log/players?game=${game.id}`}
                className={styles.row}
              >
                <div className={`${styles.tile} ${toneClass(type.tone)}`}>
                  {game.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.rowText}>
                  <div className={styles.rowName}>{game.name}</div>
                  <div className={styles.chips}>
                    <Chip size="s">
                      <UsersIcon />
                      {formatPlayers(game)}
                    </Chip>
                    {game.typical_duration_min && (
                      <Chip size="s">
                        <ClockIcon />
                        {game.typical_duration_min} min
                      </Chip>
                    )}
                    {game.is_classic && (
                      <Chip size="s" tone="turquoise">
                        Classic
                      </Chip>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
