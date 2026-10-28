"use server";

import { revalidatePath } from "next/cache";
import { awardAchievements } from "@/lib/achievements/award";
import { getProfile } from "@/lib/auth/session";
import { rebuildGameRatings } from "@/lib/rating/rebuild";
import { createClient } from "@/lib/supabase/server";
import {
  RESULT_TYPES,
  placesFromScores,
  applyTiebreak,
  placesFromWinner,
  validatePlaces,
} from "./places";

const ME = "me";
const UUID = /^[0-9a-f-]{36}$/i;
const PROFILE_KEY = /^p:[0-9a-f-]{36}$/i;

// Creates a guest with a name only and returns it, so the log flow can add it
// to the list without reloading the page.
export async function createGuest(name) {
  const trimmed = String(name ?? "").trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { error: "Give the guest a name of up to 30 characters." };
  }

  const { profile } = await getProfile();
  if (!profile) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .insert({ owner_id: profile.id, name: trimmed })
    .select("id, name")
    .single();
  if (error) {
    console.error("createGuest failed", error);
    return { error: "Could not add the guest. Try again." };
  }
  return { guest: data };
}

// Turns log flow input into the rows the database functions take. Input:
//   { gameId, resultType, keys, winner, places, scores, tiebreak, teamId }
// keys are "me", guest ids, or p: and a teammate's profile id.
// Returns { error } or { gameId, resultType, teamId, participants }.
async function buildSession(input) {
  const { gameId, resultType, winner, places: givenPlaces, scores: givenScores } =
    input ?? {};
  const keys = Array.isArray(input?.keys) ? input.keys.map(String) : [];

  const keysValid = keys.every(
    (key) => key === ME || UUID.test(key) || PROFILE_KEY.test(key),
  );
  const teamId = UUID.test(String(input?.teamId ?? "")) ? input.teamId : null;
  if (
    !UUID.test(String(gameId)) ||
    !RESULT_TYPES.includes(resultType) ||
    keys.length < 1 ||
    !keysValid ||
    new Set(keys).size !== keys.length
  ) {
    return { error: "Something is missing. Go back and try again." };
  }

  let places;
  const scores = {};
  try {
    if (resultType === "winner") {
      places = placesFromWinner(keys, String(winner ?? ""));
    } else if (resultType === "points") {
      for (const key of keys) {
        const raw = String(givenScores?.[key] ?? "").trim();
        const score = Number(raw);
        if (raw === "" || !Number.isFinite(score)) {
          throw new Error("Enter a score for every player.");
        }
        scores[key] = score;
      }
      places = placesFromScores(scores);
      if (input?.tiebreak) {
        places = applyTiebreak(places, String(input.tiebreak));
      }
    } else {
      places = {};
      for (const key of keys) {
        places[key] = Number.parseInt(String(givenPlaces?.[key]), 10);
      }
      validatePlaces(places);
    }
  } catch (error) {
    return { error: error.message };
  }

  const { profile } = await getProfile();
  if (!profile) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  const participants = keys.map((key) => ({
    profile_id:
      key === ME ? profile.id : key.startsWith("p:") ? key.slice(2) : null,
    guest_id: key === ME || key.startsWith("p:") ? null : key,
    place: places[key],
    score: resultType === "points" ? scores[key] : null,
  }));

  return { gameId, resultType, teamId, participants };
}

// After a session is saved or edited. A failed rating update must not undo
// it: ratings are derived data and can always be rebuilt from the sessions.
// Achievements come after ratings, because some depend on them, under the
// same rule.
async function afterSave(gameIds, participants) {
  for (const gameId of new Set(gameIds)) {
    try {
      await rebuildGameRatings(gameId);
    } catch (ratingError) {
      console.error("rebuildGameRatings failed", ratingError);
    }
  }
  try {
    await awardAchievements(
      participants.map((p) => p.profile_id).filter(Boolean),
    );
  } catch (achievementError) {
    console.error("awardAchievements failed", achievementError);
  }
}

// Saves a session from the log flow. The create_session database function
// saves everything at once.
export async function saveSession(input) {
  const built = await buildSession(input);
  if (built.error) return { error: built.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_session", {
    p_game_id: built.gameId,
    p_result_type: built.resultType,
    p_participants: built.participants,
    p_team_id: built.teamId,
  });
  if (error) {
    console.error("saveSession failed", error);
    return { error: "Could not save the session. Try again." };
  }

  await afterSave([built.gameId], built.participants);
  return { ok: true };
}

// Saves an edit of a session the player logged. Same input as saveSession.
// The ratings of the old game are rebuilt too when the game changed.
export async function updateSession(sessionId, input) {
  if (!UUID.test(String(sessionId))) {
    return { error: "Unknown session." };
  }
  const built = await buildSession(input);
  if (built.error) return { error: built.error };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("sessions")
    .select("game_id, team_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!before) {
    return { error: "Unknown session." };
  }
  // A session stays in the team it was logged in (or stays personal).
  if ((built.teamId ?? null) !== (before.team_id ?? null)) {
    return { error: "A session cannot move to another team." };
  }

  const { error } = await supabase.rpc("update_session", {
    p_session_id: sessionId,
    p_game_id: built.gameId,
    p_result_type: built.resultType,
    p_participants: built.participants,
    p_team_id: built.teamId,
  });
  if (error) {
    console.error("updateSession failed", error);
    return {
      error: error.message?.includes("Only the player")
        ? "Only the player who logged a session can edit it."
        : "Could not save your changes. Try again.",
    };
  }

  await afterSave([before.game_id, built.gameId], built.participants);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Deletes a session of the player and rebuilds the ratings of its game, so the
// result is the same as if the session had never been logged.
export async function deleteSession(sessionId) {
  if (!UUID.test(String(sessionId))) {
    return { error: "Unknown session." };
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, game_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return { error: "Unknown session." };
  }

  const { data, error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .select("id");
  if (error || !data?.length) {
    if (error) console.error("deleteSession failed", error);
    return { error: "Only the player who logged a session can delete it." };
  }

  try {
    await rebuildGameRatings(session.game_id);
  } catch (ratingError) {
    console.error("rebuildGameRatings failed", ratingError);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
