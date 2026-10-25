// Elo-style rating for sessions with two or more players.
// Pure functions: no database, no clock. See docs/rating.md.
//
// A session with N participants becomes pairwise comparisons. Every player is
// compared with every other player by place, all using the ratings from
// before the session. For player A:
//   delta_A = (K / (N - 1)) * sum over the other players B of (S_AB - E_AB)
// The deltas of one session add up to zero.

import { RATING_CONFIG } from "./config";

// Expected score of A against B. Always between 0 and 1.
export function expectedScore(ratingA, ratingB, scale = RATING_CONFIG.scale) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / scale));
}

// Actual score of A against B: 1 for a better place, 0.5 for a tie, 0 if worse.
export function actualScore(placeA, placeB) {
  if (placeA < placeB) return 1;
  return placeA === placeB ? 0.5 : 0;
}

// players: [{ key, rating, place }]. Returns [{ key, before, after, delta }].
export function rateSession(players, config = RATING_CONFIG) {
  const count = players.length;
  if (count < config.minParticipants) {
    return players.map((p) => ({
      key: p.key,
      before: p.rating,
      after: p.rating,
      delta: 0,
    }));
  }

  return players.map((a) => {
    let sum = 0;
    for (const b of players) {
      if (b === a) continue;
      sum +=
        actualScore(a.place, b.place) -
        expectedScore(a.rating, b.rating, config.scale);
    }
    const delta = (config.k / (count - 1)) * sum;
    return { key: a.key, before: a.rating, after: a.rating + delta, delta };
  });
}

// Replay order: by play time, then creation time, then id as a last tie-break,
// so the same sessions always give the same ratings.
export function compareSessions(a, b) {
  const byPlayed = new Date(a.playedAt) - new Date(b.playedAt);
  if (byPlayed !== 0) return byPlayed;
  const byCreated = new Date(a.createdAt) - new Date(b.createdAt);
  if (byCreated !== 0) return byCreated;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// Rebuilds the ratings of one game from scratch by replaying its sessions.
// sessions: [{ id, playedAt, createdAt, participants: [{ key, place }] }]
// Returns { ratings: Map(key -> { rating, gamesCount }), history: [...] }.
export function replaySessions(sessions, config = RATING_CONFIG) {
  const ratings = new Map();
  const history = [];

  for (const session of [...sessions].sort(compareSessions)) {
    if (session.participants.length < config.minParticipants) continue;

    const players = session.participants.map((p) => ({
      key: p.key,
      place: p.place,
      rating: ratings.get(p.key)?.rating ?? config.initial,
    }));

    for (const result of rateSession(players, config)) {
      const current = ratings.get(result.key) ?? {
        rating: config.initial,
        gamesCount: 0,
      };
      ratings.set(result.key, {
        rating: result.after,
        gamesCount: current.gamesCount + 1,
      });
      history.push({
        sessionId: session.id,
        key: result.key,
        before: result.before,
        after: result.after,
      });
    }
  }

  return { ratings, history };
}
