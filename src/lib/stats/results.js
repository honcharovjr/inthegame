// Reads the player's own results, one row per session they played in, in the
// shape monthStats expects: { place, participants }. since: an ISO date to
// count from, or nothing for all time.
export async function loadResults(supabase, profileId, since) {
  let query = supabase
    .from("session_participants")
    .select("place, sessions!inner(played_at, session_participants(count))")
    .eq("profile_id", profileId);
  if (since) query = query.gte("sessions.played_at", since);

  const { data, error } = await query;
  const rows = (data ?? []).map((row) => ({
    place: row.place,
    participants: row.sessions.session_participants[0]?.count ?? 1,
  }));
  return { rows, error };
}
