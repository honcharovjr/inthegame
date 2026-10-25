"use server";

import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  RESULT_TYPES,
  placesFromScores,
  placesFromWinner,
  validatePlaces,
} from "./places";

const ME = "me";
const UUID = /^[0-9a-f-]{36}$/i;

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

// Saves a session. Input from the log flow:
//   { gameId, resultType, keys, winner, places, scores }
// keys are "me" or guest ids. Turns the input into places, checks them, then
// calls the create_session database function, which saves everything at once.
export async function saveSession(input) {
  const { gameId, resultType, winner, places: givenPlaces, scores: givenScores } =
    input ?? {};
  const keys = Array.isArray(input?.keys) ? input.keys.map(String) : [];

  const keysValid = keys.every((key) => key === ME || UUID.test(key));
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
    profile_id: key === ME ? profile.id : null,
    guest_id: key === ME ? null : key,
    place: places[key],
    score: resultType === "points" ? scores[key] : null,
  }));

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_session", {
    p_game_id: gameId,
    p_result_type: resultType,
    p_participants: participants,
  });
  if (error) {
    console.error("saveSession failed", error);
    return { error: "Could not save the session. Try again." };
  }

  return { ok: true };
}
