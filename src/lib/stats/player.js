import { monthStats } from "./month";

// Personal stats (FR-16): games played, wins and win rate, overall and per
// game. Definitions follow docs/rating.md, as monthStats does.

// rows: one per session you played in, { place, participants, game }, where
// game is { id, name, ... } or null for a game that was removed.
// Returns { overall, games }, games most played first.
export function playerStats(rows) {
  const byGame = new Map();
  for (const row of rows) {
    if (!row.game) continue;
    const entry = byGame.get(row.game.id) ?? { game: row.game, rows: [] };
    entry.rows.push(row);
    byGame.set(row.game.id, entry);
  }

  const games = [...byGame.values()]
    .map(({ game, rows: gameRows }) => ({ game, ...monthStats(gameRows) }))
    .sort(
      (a, b) =>
        b.played - a.played ||
        b.wins - a.wins ||
        a.game.name.localeCompare(b.game.name),
    );

  return { overall: monthStats(rows), games };
}
