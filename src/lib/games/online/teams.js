// The id of the only team every player is in, or null when they share none
// or several. memberships: [{ team_id, profile_id }] of these players.
export function onlySharedTeam(memberships, players) {
  const counts = new Map();
  for (const row of memberships) {
    if (players.includes(row.profile_id)) counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }
  const shared = [...counts].filter(([, count]) => count === players.length).map(([id]) => id);
  return shared.length === 1 ? shared[0] : null;
}
