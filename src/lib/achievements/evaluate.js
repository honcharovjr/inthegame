import { ACHIEVEMENTS } from "./catalog";

// Rules of docs/achievements.md as pure functions. Given the history of one
// player, say which achievements are earned and how far the others are.
//
// input:
//   me: "p:<profile id>", the player's own key
//   sessions: confirmed sessions the player took part in, oldest first:
//     { id, playedAt (ISO), gameId, teamId, gameCreatedBy,
//       participants: [{ key, place }] }  keys are p:<id> or g:<id>
//   ratings: [{ gameId, rating, gamesCount }] current ratings of the player
//   ratingBefore: { "<sessionId>|<key>": number } rating before each session
//   teams: [{ ownedByMe, memberCount, sessionCount, leaderKey }] teams the
//     player belongs to. leaderKey is the leader of the team leaderboard
//
// Returns [{ code, earned, current, target }] in catalog order. current is
// capped at target.

const DAY = 86400000;

const isRanked = (session) => session.participants.length >= 2;

function myPlace(session, me) {
  return session.participants.find((p) => p.key === me)?.place ?? null;
}

const isWin = (session, me) => isRanked(session) && myPlace(session, me) === 1;

// Longest run of equal results in a list of booleans, for the value asked
function longestRun(flags, wanted) {
  let best = 0;
  let run = 0;
  for (const flag of flags) {
    run = flag === wanted ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

// A win straight after at least `losses` losses in a row
function hasComeback(flags, losses) {
  let run = 0;
  for (const win of flags) {
    if (win && run >= losses) return true;
    run = win ? 0 : run + 1;
  }
  return false;
}

// Weeks start on Monday. 1 January 1970 was a Thursday, hence the + 3.
const weekOf = (iso) => Math.floor((Math.floor(Date.parse(iso) / DAY) + 3) / 7);
const dayOf = (iso) => Math.floor(Date.parse(iso) / DAY);

function longestWeekStreak(sessions) {
  const weeks = [...new Set(sessions.map((s) => weekOf(s.playedAt)))].sort(
    (a, b) => a - b,
  );
  let best = 0;
  let run = 0;
  weeks.forEach((week, index) => {
    run = index > 0 && week === weeks[index - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

function mostInOneDay(sessions) {
  const counts = new Map();
  for (const session of sessions) {
    const day = dayOf(session.playedAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

export function evaluateAchievements(input) {
  const { me, sessions, ratings = [], ratingBefore = {}, teams = [] } = input;
  const ranked = sessions.filter(isRanked);
  const winFlags = ranked.map((session) => isWin(session, me));
  const wins = winFlags.filter(Boolean).length;

  const winsByGame = new Map();
  ranked.forEach((session, index) => {
    if (!winFlags[index]) return;
    winsByGame.set(session.gameId, (winsByGame.get(session.gameId) ?? 0) + 1);
  });

  const games = new Set(sessions.map((s) => s.gameId));
  const others = new Set();
  for (const session of sessions) {
    for (const p of session.participants) if (p.key !== me) others.add(p.key);
  }

  const withGuest = sessions.filter((s) =>
    s.participants.some((p) => p.key.startsWith("g:")),
  ).length;
  const bestRating = Math.max(
    0,
    ...ratings
      .filter((row) => row.gamesCount >= 3)
      .map((row) => Math.round(Number(row.rating))),
  );

  const slayer = ranked.some((session) => {
    const place = myPlace(session, me);
    const mine = ratingBefore[`${session.id}|${me}`];
    if (mine === undefined) return false;
    return session.participants.some((p) => {
      const theirs = ratingBefore[`${session.id}|${p.key}`];
      return (
        p.key !== me && p.place > place && theirs !== undefined && theirs - mine >= 200
      );
    });
  });

  // Each rule gives a count to reach (target) and where the player is (current)
  const rules = {
    "first-game": [sessions.length, 1],
    regular: [sessions.length, 10],
    "table-veteran": [sessions.length, 50],
    centurion: [sessions.length, 100],

    "first-win": [wins, 1],
    "winners-circle": [wins, 10],
    champion: [wins, 25],
    dynasty: [wins, 50],
    "hot-hand": [longestRun(winFlags, true), 3],
    "on-fire": [longestRun(winFlags, true), 5],
    "comeback-kid": [hasComeback(winFlags, 3) ? 1 : 0, 1],
    "dead-heat": [
      ranked.some(
        (s) =>
          myPlace(s, me) === 1 && s.participants.filter((p) => p.place === 1).length > 1,
      )
        ? 1
        : 0,
      1,
    ],

    explorer: [games.size, 5],
    globetrotter: [games.size, 10],
    inventor: [sessions.some((s) => s.gameCreatedBy === me.slice(2)) ? 1 : 0, 1],
    "jack-of-all-trades": [[...winsByGame.values()].filter((n) => n >= 1).length, 3],
    "master-of-one": [Math.max(0, ...winsByGame.values()), 10],

    "not-alone": [
      sessions.some((s) => s.participants.some((p) => p.key !== me && p.key.startsWith("p:")))
        ? 1
        : 0,
      1,
    ],
    "full-house": [sessions.some((s) => s.participants.length >= 5) ? 1 : 0, 1],
    "party-host": [withGuest, 10],
    "crowd-pleaser": [others.size, 10],

    "team-player": [sessions.some((s) => s.teamId) ? 1 : 0, 1],
    founder: [teams.some((t) => t.ownedByMe) ? 1 : 0, 1],
    recruiter: [teams.some((t) => t.ownedByMe && t.memberCount >= 4) ? 1 : 0, 1],
    "team-champion": [
      teams.some((t) => t.memberCount >= 3 && t.sessionCount >= 10 && t.leaderKey === me)
        ? 1
        : 0,
      1,
    ],

    "rising-star": [bestRating, 1100],
    elite: [bestRating, 1300],
    "giant-slayer": [slayer ? 1 : 0, 1],

    "weekly-habit": [longestWeekStreak(sessions), 4],
    marathon: [mostInOneDay(sessions), 5],
  };

  return ACHIEVEMENTS.map((item) => {
    const [value, target] = rules[item.code];
    return {
      code: item.code,
      earned: value >= target,
      current: Math.min(value, target),
      target,
    };
  });
}
