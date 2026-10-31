import { createAdminClient } from "@/lib/supabase/admin";
import { replaySessions } from "./elo";

const PAGE = 500;

// Server side only. Recomputes every rating of one game from its sessions and
// stores the result. Uses the service role key, because clients may never
// write ratings.
export async function rebuildGameRatings(gameId) {
  const admin = createAdminClient();

  // All confirmed sessions of the game, oldest first, fetched in pages.
  const sessions = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("sessions")
      .select(
        "id, played_at, created_at, session_participants(profile_id, guest_id, place)",
      )
      .eq("game_id", gameId)
      .eq("status", "confirmed")
      .order("played_at")
      .order("created_at")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    sessions.push(...data);
    if (data.length < PAGE) break;
  }

  const { ratings, history } = replaySessions(
    sessions.map((session) => ({
      id: session.id,
      playedAt: session.played_at,
      createdAt: session.created_at,
      participants: session.session_participants.map((p) => ({
        key: p.profile_id ? `p:${p.profile_id}` : `g:${p.guest_id}`,
        place: p.place,
        guest: Boolean(p.guest_id),
      })),
    })),
  );

  const owner = (key) =>
    key.startsWith("p:")
      ? { profile_id: key.slice(2), guest_id: null }
      : { profile_id: null, guest_id: key.slice(2) };

  const { error } = await admin.rpc("replace_game_ratings", {
    p_game_id: gameId,
    p_ratings: [...ratings].map(([key, value]) => ({
      ...owner(key),
      rating: value.rating,
      games_count: value.gamesCount,
    })),
    p_history: history.map((row) => ({
      session_id: row.sessionId,
      ...owner(row.key),
      rating_before: row.before,
      rating_after: row.after,
    })),
  });
  if (error) throw error;
}
