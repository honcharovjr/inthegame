// The games a team has played, most played first, then by name.
// sessions: [{ gameId, game: { name, type, emoji } }].
// Returns [{ id, name, type, emoji, sessions }].
export function teamGames(sessions) {
  const games = new Map();
  for (const session of sessions) {
    if (!session.gameId) continue;
    const entry = games.get(session.gameId) ?? {
      id: session.gameId,
      name: session.game?.name ?? "Game",
      type: session.game?.type,
      emoji: session.game?.emoji,
      sessions: 0,
    };
    entry.sessions += 1;
    games.set(session.gameId, entry);
  }
  return [...games.values()].sort(
    (a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name),
  );
}
