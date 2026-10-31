import { awardAchievements } from "@/lib/achievements/award";
import { findPlayable } from "@/lib/games/playable";
import { rebuildGameRatings } from "@/lib/rating/rebuild";
import { placesFromScores } from "@/lib/sessions/places";
import { createAdminClient } from "@/lib/supabase/admin";
import { onlySharedTeam } from "./teams";

// Server side only. Saves a finished online game as a points session of the
// catalog game, then updates its ratings and the players' achievements
// (FR-46, change C30). The server made every roll, so the result is trusted.
// The session goes to the one team all players share, otherwise it is the
// host's personal session. Answers the new session id, or null when it could
// not be saved; ratings and achievements are rebuilt from sessions anyway.
export async function saveOnlineResult(room) {
  const { game: played, host, end } = room.state;
  const admin = createAdminClient();

  const catalogName = findPlayable(room.game_key)?.catalogName;
  const { data: game } = await admin
    .from("games")
    .select("id")
    .is("created_by", null)
    .eq("name", catalogName ?? "")
    .maybeSingle();
  if (!game) {
    console.error("saveOnlineResult: no catalog game", room.game_key);
    return null;
  }

  const players = Object.keys(end.scores);
  const places = placesFromScores(end.scores);
  const { data: session, error } = await admin
    .from("sessions")
    .insert({
      game_id: game.id,
      created_by: host,
      team_id: await sharedTeam(admin, players).catch(() => null),
      played_at: new Date().toISOString(),
      result_type: "points",
      note: "Played online",
    })
    .select("id")
    .single();
  if (error) {
    console.error("saveOnlineResult failed", error);
    return null;
  }

  const { error: participantsError } = await admin.from("session_participants").insert(
    players.map((id) => ({
      session_id: session.id,
      profile_id: id,
      guest_id: null,
      place: places[id],
      score: end.scores[id],
    })),
  );
  if (participantsError) {
    console.error("saveOnlineResult participants failed", participantsError);
    await admin.from("sessions").delete().eq("id", session.id);
    return null;
  }

  try {
    await rebuildGameRatings(game.id);
  } catch (ratingError) {
    console.error("saveOnlineResult ratings failed", ratingError);
  }
  try {
    await awardAchievements(played.players);
  } catch (achievementError) {
    console.error("saveOnlineResult achievements failed", achievementError);
  }
  return session.id;
}

async function sharedTeam(admin, players) {
  const { data, error } = await admin.from("team_members").select("team_id, profile_id").in("profile_id", players);
  if (error) throw error;
  return onlySharedTeam(data, players);
}
