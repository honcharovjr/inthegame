"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  RESULT_TYPES,
  placesFromScores,
  placesFromWinner,
  validatePlaces,
} from "./places";

const ME = "me";

async function readProfileId(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

// Creates a guest with a name only, then returns to the players step with
// the new guest already selected.
export async function addGuest(gameId, selectedIds, previousState, formData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 30) {
    return { error: "Give the guest a name of up to 30 characters." };
  }

  const supabase = await createClient();
  const profileId = await readProfileId(supabase);
  if (!profileId) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({ owner_id: profileId, name })
    .select("id")
    .single();
  if (error) {
    return { error: "Could not add the guest. Try again." };
  }

  const selected = [...selectedIds, data.id].join(",");
  redirect(`/log/players?game=${gameId}&with=${selected}`);
}

// Saves the session. Turns the form into places, checks them, then calls the
// create_session database function, which saves everything in one step.
export async function saveSession(previousState, formData) {
  const gameId = String(formData.get("game") ?? "");
  const resultType = String(formData.get("result_type") ?? "");
  const keys = formData.getAll("participant").map(String);

  if (!gameId || !RESULT_TYPES.includes(resultType) || keys.length < 1) {
    return { error: "Something is missing. Go back and try again." };
  }

  let places;
  let scores = {};
  try {
    if (resultType === "winner") {
      places = placesFromWinner(keys, String(formData.get("winner") ?? ""));
    } else if (resultType === "points") {
      for (const key of keys) {
        const raw = String(formData.get(`score_${key}`) ?? "").trim();
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
        places[key] = Number.parseInt(String(formData.get(`place_${key}`)), 10);
      }
      validatePlaces(places);
    }
  } catch (error) {
    return { error: error.message };
  }

  const supabase = await createClient();
  const profileId = await readProfileId(supabase);
  if (!profileId) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  const participants = keys.map((key) => ({
    profile_id: key === ME ? profileId : null,
    guest_id: key === ME ? null : key,
    place: places[key],
    score: resultType === "points" ? scores[key] : null,
  }));

  const { error } = await supabase.rpc("create_session", {
    p_game_id: gameId,
    p_result_type: resultType,
    p_participants: participants,
  });
  if (error) {
    return { error: "Could not save the session. Try again." };
  }

  redirect("/?saved=1");
}
