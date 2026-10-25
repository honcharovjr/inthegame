// Rating parameters. Starting values from docs/rating.md section 3.
// They are guesses to be tuned on pilot data, so they live in one place.
export const RATING_CONFIG = {
  // Rating of a player with no games in this game
  initial: 1000,
  // Maximum change scale
  k: 32,
  // Standard Elo scale
  scale: 400,
  // Sessions with fewer participants are stored but not rated
  minParticipants: 2,
  // Games needed to appear on a leaderboard
  minGamesForLeaderboard: 3,
};
