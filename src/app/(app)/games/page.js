import BackButton from "@/components/BackButton/BackButton";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import { FilterBody, FilterChip, FilterLoading } from "@/components/FilterLoading/FilterLoading";
import GameRow from "@/components/GameRow/GameRow";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireUser } from "@/lib/auth/session";
import { GAME_TYPES } from "@/lib/games/types";
import { createClient } from "@/lib/supabase/server";
import AddGameButton from "./AddGameButton";
import GamesToolbar from "./GamesToolbar";
import styles from "./games.module.css";

export const metadata = { title: "Games" };

const PAGE_SIZE = 20;
const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6];

export default function GamesPage({ searchParams }) {
  return (
    <main className={styles.page}>
      <BackButton fallback="/" />
      <h1 className={styles.title}>Games</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function ListSkeleton() {
  return (
    <div className={styles.skeletonList}>
      <Skeleton height={64} radius={22} />
      <Skeleton height={64} radius={22} delay={80} />
      <Skeleton height={64} radius={22} delay={160} />
      <Skeleton height={64} radius={22} delay={240} />
      <Skeleton height={64} radius={22} delay={320} />
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <Skeleton height={150} radius={22} />
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
    <FilterLoading>
    <div className={`${styles.body} stagger`}>
      <GamesToolbar
        filters={filters}
        playerHrefs={[0, ...PLAYER_COUNTS].map((count) =>
          buildHref(filters, { players: count || null, page: 1 }),
        )}
      >
        <div className={styles.types} aria-label="Type">
          <FilterChip
            href={buildHref(filters, { type: null, page: 1 })}
            tone={filters.type ? "default" : "active"}
          >
            All
          </FilterChip>
          {GAME_TYPES.map((type) => (
            <FilterChip
              key={type.value}
              href={buildHref(filters, { type: type.value, page: 1 })}
              tone={filters.type === type.value ? "active" : "default"}
            >
              {type.label}
            </FilterChip>
          ))}
        </div>
      </GamesToolbar>

      <AddGameButton existingNames={existingNames} />

      <FilterBody skeleton={<ListSkeleton />}>
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
            <FilterChip href={buildHref(filters, { page: filters.page - 1 })}>
              Previous
            </FilterChip>
          )}
          <Chip tone="pink">
            Page {filters.page} of {totalPages}
          </Chip>
          {filters.page < totalPages && (
            <FilterChip href={buildHref(filters, { page: filters.page + 1 })}>
              Next
            </FilterChip>
          )}
        </nav>
      )}
      </FilterBody>
    </div>
    </FilterLoading>
  );
}
