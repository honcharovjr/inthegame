import { RATING_CONFIG } from "../rating/config";

// One rating for a player across games (docs/rating.md section 6, change
// C23): the average of their game ratings, weighted by rated sessions, over
// games with at least minGames of them. Rounded. Null when no game counts.
// rows: [{ rating, games_count }], values may be strings.
export function overallRating(rows, minGames = RATING_CONFIG.minGamesForLeaderboard) {
  const counted = rows.filter((row) => Number(row.games_count) >= minGames);
  const weight = counted.reduce((sum, row) => sum + Number(row.games_count), 0);
  if (weight === 0) return null;
  const total = counted.reduce((sum, row) => sum + Number(row.rating) * Number(row.games_count), 0);
  return Math.round(total / weight);
}

// The games that count toward the overall rating.
export function countedGames(rows, minGames = RATING_CONFIG.minGamesForLeaderboard) {
  return rows.filter((row) => Number(row.games_count) >= minGames);
}

// Ratings for a leaderboard, as a Map of profile id -> rating. byGame: the
// rating in that one game; otherwise each player's overall rating. Players
// without enough rated sessions are left out.
// rows: [{ profile_id, rating, games_count }] of the players and games shown.
export function memberRatings(rows, byGame, minGames = RATING_CONFIG.minGamesForLeaderboard) {
  const byPlayer = new Map();
  for (const row of rows) {
    byPlayer.set(row.profile_id, [...(byPlayer.get(row.profile_id) ?? []), row]);
  }
  const result = new Map();
  for (const [id, list] of byPlayer) {
    const rating = byGame
      ? Number(list[0].games_count) >= minGames
        ? Math.round(Number(list[0].rating))
        : null
      : overallRating(list, minGames);
    if (rating !== null) result.set(id, rating);
  }
  return result;
}
