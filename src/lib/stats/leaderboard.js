// Team leaderboard. Definitions follow docs/rating.md section 6.
// A win is place 1 in a session with at least 2 participants. Win rate counts
// only those sessions. With ratings, ranked by rating (change C23), players
// without one last; wins, win rate and games played break ties and rank
// the rest. Without ratings, ranked by those alone.

// sessions: [{ participants: [{ profileId, place }] }] (guests may be left out
// or have a null profileId, they are not on the board).
// members: [{ id, name }]. ratings: optional Map of member id -> rating.
export function teamLeaderboard(sessions, members, ratings = null) {
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
      rating: ratings?.get(row.id) ?? null,
    }))
    .sort(
      (a, b) =>
        (b.rating ?? -Infinity) - (a.rating ?? -Infinity) ||
        b.wins - a.wins ||
        (b.winRate ?? -1) - (a.winRate ?? -1) ||
        b.games - a.games ||
        a.name.localeCompare(b.name),
    );
}
