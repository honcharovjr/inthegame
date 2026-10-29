// Head-to-head records against the people a player meets most. sessions:
// [{ participants: [{ key, place, ...person }] }], each a session the player
// took part in. me: the player's key. A lower place beats a higher one, the
// same place is a tie. Returns up to `limit` rivals, most games together
// first: { key, wins, losses, ties, games, ...person }.
export function headToHead(sessions, me, limit = 3) {
  const rivals = new Map();
  for (const session of sessions) {
    const mine = session.participants.find((p) => p.key === me);
    if (!mine) continue;
    for (const other of session.participants) {
      if (other.key === me) continue;
      const entry = rivals.get(other.key) ?? { ...other, wins: 0, losses: 0, ties: 0, games: 0 };
      delete entry.place;
      entry.games += 1;
      if (mine.place < other.place) entry.wins += 1;
      else if (mine.place > other.place) entry.losses += 1;
      else entry.ties += 1;
      rivals.set(other.key, entry);
    }
  }
  return [...rivals.values()]
    .sort((a, b) => b.games - a.games || b.wins + b.losses - (a.wins + a.losses))
    .slice(0, limit);
}
