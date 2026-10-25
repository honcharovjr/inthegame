// The 30 achievements, as in docs/achievements.md. The same codes are stored
// in the achievements table by a migration, which a test keeps in step.
// tier: 1 easy, 2 medium, 3 hard.
export const GROUPS = [
  { id: "start", label: "Getting started" },
  { id: "winning", label: "Winning" },
  { id: "variety", label: "Variety" },
  { id: "social", label: "Social" },
  { id: "teams", label: "Teams" },
  { id: "rating", label: "Rating" },
  { id: "habits", label: "Habits" },
];

export const ACHIEVEMENTS = [
  { code: "first-game", group: "start", name: "First Game", description: "Log your first session", tier: 1 },
  { code: "regular", group: "start", name: "Regular", description: "Play 10 sessions", tier: 1 },
  { code: "table-veteran", group: "start", name: "Table Veteran", description: "Play 50 sessions", tier: 2 },
  { code: "centurion", group: "start", name: "Centurion", description: "Play 100 sessions", tier: 3 },

  { code: "first-win", group: "winning", name: "First Win", description: "Win a session", tier: 1 },
  { code: "winners-circle", group: "winning", name: "Winner's Circle", description: "Win 10 sessions", tier: 2 },
  { code: "champion", group: "winning", name: "Champion", description: "Win 25 sessions", tier: 2 },
  { code: "dynasty", group: "winning", name: "Dynasty", description: "Win 50 sessions", tier: 3 },
  { code: "hot-hand", group: "winning", name: "Hot Hand", description: "Win 3 sessions in a row", tier: 2 },
  { code: "on-fire", group: "winning", name: "On Fire", description: "Win 5 sessions in a row", tier: 3 },
  { code: "comeback-kid", group: "winning", name: "Comeback Kid", description: "Win right after losing 3 sessions in a row", tier: 2 },
  { code: "dead-heat", group: "winning", name: "Dead Heat", description: "Share first place in a tie", tier: 1 },

  { code: "explorer", group: "variety", name: "Explorer", description: "Play 5 different games", tier: 1 },
  { code: "globetrotter", group: "variety", name: "Globetrotter", description: "Play 10 different games", tier: 2 },
  { code: "inventor", group: "variety", name: "Inventor", description: "Play a session of a custom game you created", tier: 1 },
  { code: "jack-of-all-trades", group: "variety", name: "Jack of All Trades", description: "Win in 3 different games", tier: 2 },
  { code: "master-of-one", group: "variety", name: "Master of One", description: "Win 10 sessions of the same game", tier: 3 },

  { code: "not-alone", group: "social", name: "Not Alone", description: "Play a session with another registered player", tier: 1 },
  { code: "full-house", group: "social", name: "Full House", description: "Play a session with 5 or more players", tier: 1 },
  { code: "party-host", group: "social", name: "Party Host", description: "Log 10 sessions that include a guest", tier: 2 },
  { code: "crowd-pleaser", group: "social", name: "Crowd Pleaser", description: "Play with 10 different people", tier: 2 },

  { code: "team-player", group: "teams", name: "Team Player", description: "Log a session in a team", tier: 1 },
  { code: "founder", group: "teams", name: "Founder", description: "Create a team", tier: 1 },
  { code: "recruiter", group: "teams", name: "Recruiter", description: "Own a team with 4 or more members", tier: 2 },
  { code: "team-champion", group: "teams", name: "Team Champion", description: "Lead a team of 3 or more after 10 team sessions", tier: 3 },

  { code: "rising-star", group: "rating", name: "Rising Star", description: "Reach a rating of 1100 in a game with 3 rated sessions", tier: 2 },
  { code: "elite", group: "rating", name: "Elite", description: "Reach a rating of 1300 in a game with 3 rated sessions", tier: 3 },
  { code: "giant-slayer", group: "rating", name: "Giant Slayer", description: "Beat a player rated 200 or more above you", tier: 3 },

  { code: "weekly-habit", group: "habits", name: "Weekly Habit", description: "Log a session in each of 4 weeks in a row", tier: 2 },
  { code: "marathon", group: "habits", name: "Marathon", description: "Log 5 sessions in one day", tier: 2 },
];

export function findAchievement(code) {
  return ACHIEVEMENTS.find((item) => item.code === code) ?? null;
}
