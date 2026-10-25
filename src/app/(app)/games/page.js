import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import GameRow from "@/components/GameRow/GameRow";
import { SearchIcon } from "@/components/icons";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireUser } from "@/lib/auth/session";
import { GAME_TYPES } from "@/lib/games/types";
import { createClient } from "@/lib/supabase/server";
import AddGameButton from "./AddGameButton";
import PlayersSlider from "./PlayersSlider";
import styles from "./games.module.css";

export const metadata = { title: "Games" };

const PAGE_SIZE = 20;
const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6];

export default function GamesPage({ searchParams }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Games</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <div className={styles.toolbar}>
        <Skeleton height={48} radius={24} />
        <Skeleton height={78} radius={22} delay={40} />
      </div>
      <div className={styles.filters}>
        <Skeleton width={56} height={32} radius={16} delay={80} />
        <Skeleton width={72} height={32} radius={16} delay={120} />
        <Skeleton width={64} height={32} radius={16} delay={160} />
        <Skeleton width={64} height={32} radius={16} delay={200} />
      </div>
      <div className={styles.skeletonList}>
        <Skeleton height={64} radius={22} delay={240} />
        <Skeleton height={64} radius={22} delay={320} />
        <Skeleton height={64} radius={22} delay={400} />
        <Skeleton height={64} radius={22} delay={480} />
        <Skeleton height={64} radius={22} delay={560} />
      </div>
    </>
  );
}

function readFilters(params) {
  const q = String(params.q ?? "").trim().slice(0, 60);
  const type = GAME_TYPES.some((t) => t.value === params.type)
    ? params.type
    : null;
  const players = Number.parseInt(params.players, 10);
  const page = Number.parseInt(params.page, 10);
  return {
    q,
    type,
    players: players >= 1 && players <= 12 ? players : null,
    page: page >= 1 ? page : 1,
  };
}

function buildHref(filters, changes) {
  const next = { ...filters, ...changes };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.type) query.set("type", next.type);
  if (next.players) query.set("players", String(next.players));
  if (next.page > 1) query.set("page", String(next.page));
  const text = query.toString();
  return text ? `/games?${text}` : "/games";
}

// Reads the URL query and the database, so it streams in behind Suspense.
async function Catalog({ searchParams }) {
  await requireUser();
  const filters = readFilters(await searchParams);
  const from = (filters.page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("games")
    .select(
      "id, name, type, emoji, is_classic, min_players, max_players, typical_duration_min, created_by",
      { count: "exact" },
    )
    .order("name")
    .range(from, from + PAGE_SIZE - 1);

  if (filters.q) {
    // Escape the characters that act as wildcards in a LIKE pattern.
    query = query.ilike("name", `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.players) {
    query = query
      .lte("min_players", filters.players)
      .gte("max_players", filters.players);
  }

  const [{ data: games, count, error }, namesResult] = await Promise.all([
    query,
    supabase.from("games").select("name"),
  ]);
  const existingNames = (namesResult.data ?? []).map((row) =>
    row.name.toLowerCase(),
  );
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className={`${styles.body} stagger`}>
<div className={styles.toolbar}>
      <form method="get" role="search" className={styles.search}>
        <SearchIcon size={20} />
        <input
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search games"
          aria-label="Search games"
        />
        {filters.type && <input type="hidden" name="type" value={filters.type} />}
        {filters.players && (
          <input type="hidden" name="players" value={filters.players} />
        )}
      </form>

        <PlayersSlider
          value={filters.players ?? 0}
          hrefs={[0, ...PLAYER_COUNTS].map((count) =>
            buildHref(filters, { players: count || null, page: 1 }),
          )}
        />
      </div>

      <div className={styles.filters} aria-label="Type">
        <Chip
          href={buildHref(filters, { type: null, page: 1 })}
          tone={filters.type ? "white" : "active"}
        >
          All
        </Chip>
        {GAME_TYPES.map((type) => (
          <Chip
            key={type.value}
            href={buildHref(filters, { type: type.value, page: 1 })}
            tone={filters.type === type.value ? "active" : "white"}
          >
            {type.label}
          </Chip>
        ))}
      </div>

      <AddGameButton existingNames={existingNames} />

      {error && (
        <p role="alert" className={styles.problem}>
          Could not load games: {error.message}
        </p>
      )}

      {games && games.length === 0 && (
        <p className={styles.empty}>No games match these filters.</p>
      )}

      <ul className={`${styles.list} stagger`}>
        {games?.map((game) => (
          <GameRow key={game.id} game={game} />
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className={styles.pager} aria-label="Pages">
          {filters.page > 1 && (
            <Chip href={buildHref(filters, { page: filters.page - 1 })}>
              Previous
            </Chip>
          )}
          <Chip tone="pink">
            Page {filters.page} of {totalPages}
          </Chip>
          {filters.page < totalPages && (
            <Chip href={buildHref(filters, { page: filters.page + 1 })}>
              Next
            </Chip>
          )}
        </nav>
      )}
    </div>
  );
}
