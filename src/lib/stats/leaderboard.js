// Team leaderboard. Definitions follow docs/rating.md section 6.
// A win is place 1 in a session with at least 2 participants. Win rate counts
// only those sessions. Ranked by wins, then win rate, then games played.

// sessions: [{ participants: [{ profileId, place }] }] (guests may be left out
// or have a null profileId, they are not on the board).
// members: [{ id, name }].
export function teamLeaderboard(sessions, members) {
  const rows = new Map(
    members.map((member) => [
      member.id,
      { id: member.id, name: member.name, games: 0, ranked: 0, wins: 0 },
    ]),
  );

  for (const session of sessions) {
    const size = session.participants.length;
    for (const participant of session.participants) {
      const row = rows.get(participant.profileId);
      if (!row) continue;
      row.games += 1;
      if (size >= 2) {
        row.ranked += 1;
        if (participant.place === 1) row.wins += 1;
      }
    }
  }

  return [...rows.values()]
    .map((row) => ({
      id: row.id,
      name: row.name,
      games: row.games,
      wins: row.wins,
      winRate: row.ranked > 0 ? Math.round((row.wins / row.ranked) * 100) : null,
    }))
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        (b.winRate ?? -1) - (a.winRate ?? -1) ||
        b.games - a.games ||
        a.name.localeCompare(b.name),
    );
}
