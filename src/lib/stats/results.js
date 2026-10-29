// Reads the player's own results, one row per session they played in, in the
// shape monthStats expects: { place, participants, playedAt }. since: an ISO date to
// count from, or nothing for all time. withGames adds the game of each
// session as game, for playerStats.
export async function loadResults(supabase, profileId, { since, withGames = false } = {}) {
  let query = supabase
    .from("session_participants")
    .select(
      `place, sessions!inner(played_at, session_participants(count)${
        withGames ? ", games(id, name, created_by, type, emoji)" : ""
      })`,
    )
    .eq("profile_id", profileId);
  if (since) query = query.gte("sessions.played_at", since);

  const { data, error } = await query;
  const rows = (data ?? []).map((row) => ({
    place: row.place,
    participants: row.sessions.session_participants[0]?.count ?? 1,
    playedAt: row.sessions.played_at,
    ...(withGames && { game: row.sessions.games ?? null }),
  }));
  return { rows, error };
}
