// Sessions of one panel: a team, or the player's personal sessions (logged
// without a team). A session is managed only in its panel. Server-side.

export const PANEL_PAGE_SIZE = 10;

const COLUMNS =
  "id, played_at, created_by, games(name, created_by, type, emoji), session_participants(place, profile_id, profiles(nickname), guests(name))";

// supabase: the logged-in client. Give teamId for a team, or personal with
// the player's profile id. page starts at 1.
export async function loadPanelSessions(supabase, { teamId = null, profileId, page = 1 }) {
  const from = (page - 1) * PANEL_PAGE_SIZE;
  let query = supabase
    .from("sessions")
    .select(COLUMNS, { count: "exact" })
    .order("played_at", { ascending: false })
    .range(from, from + PANEL_PAGE_SIZE - 1);
  query = teamId
    ? query.eq("team_id", teamId)
    : query.is("team_id", null).eq("created_by", profileId);

  const { data, count, error } = await query;
  return {
    sessions: data ?? [],
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PANEL_PAGE_SIZE)),
    error,
  };
}

// The page of a panel from the address, 1 when missing or wrong.
export function readPage(value) {
  const page = Number.parseInt(value, 10);
  return page >= 1 ? page : 1;
}

// Where a session is managed.
export function panelHref(teamId) {
  return teamId ? `/teams/${teamId}` : "/teams/personal";
}
