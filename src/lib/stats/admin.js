// Numbers for the admin dashboard, from raw rows. Pure, so it is tested.
// Weeks are rolling 7-day windows ending at `now`, newest last, so there is
// no time zone question about where a week starts.

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

// Index of the week a time falls in: 0 is the latest week, 1 the one before.
function weeksAgo(time, now) {
  return Math.floor((now - new Date(time).getTime()) / WEEK);
}

// profiles: [{ id, created_at }]
// sessions: [{ id, game_id, created_by, played_at }]
// participants: [{ session_id, profile_id }] (guests have a null profile_id)
// games: [{ id, name, created_by }]; a custom game is marked in topGames
export function dashboardStats({
  profiles,
  sessions,
  participants,
  games,
  now = Date.now(),
  weeks = 8,
}) {
  const playedAt = new Map(sessions.map((s) => [s.id, new Date(s.played_at).getTime()]));

  // Every (player, time) pair: creators and registered participants.
  const activity = [
    ...sessions.map((s) => ({ profileId: s.created_by, time: playedAt.get(s.id) })),
    ...participants
      .filter((p) => p.profile_id && playedAt.has(p.session_id))
      .map((p) => ({ profileId: p.profile_id, time: playedAt.get(p.session_id) })),
  ].filter((item) => item.time <= now);

  const activeWithin = (days) =>
    new Set(
      activity.filter((item) => now - item.time < days * DAY).map((item) => item.profileId),
    ).size;

  const weekly = Array.from({ length: weeks }, (_, index) => {
    const ago = weeks - 1 - index;
    return {
      start: new Date(now - (ago + 1) * WEEK).toISOString(),
      sessions: sessions.filter((s) => weeksAgo(s.played_at, now) === ago && playedAt.get(s.id) <= now).length,
      signups: profiles.filter((p) => weeksAgo(p.created_at, now) === ago).length,
    };
  });

  // Returning players: active in at least two different weeks of the window.
  const weeksByPlayer = new Map();
  for (const item of activity) {
    const ago = weeksAgo(item.time, now);
    if (ago >= weeks) continue;
    if (!weeksByPlayer.has(item.profileId)) weeksByPlayer.set(item.profileId, new Set());
    weeksByPlayer.get(item.profileId).add(ago);
  }
  const activeInWindow = weeksByPlayer.size;
  const returning = [...weeksByPlayer.values()].filter((set) => set.size >= 2).length;

  const byId = new Map(games.map((g) => [g.id, g]));
  const counts = new Map();
  for (const s of sessions) {
    const time = playedAt.get(s.id);
    if (time > now || now - time >= 30 * DAY) continue;
    counts.set(s.game_id, (counts.get(s.game_id) ?? 0) + 1);
  }
  const topGames = [...counts.entries()]
    .map(([id, count]) => ({
      id,
      name: byId.get(id)?.name ?? "Unknown game",
      custom: Boolean(byId.get(id)?.created_by),
      sessions: count,
    }))
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    weekly,
    active7: activeWithin(7),
    active30: activeWithin(30),
    activeInWindow,
    returning,
    returningShare: activeInWindow ? returning / activeInWindow : 0,
    topGames,
  };
}
