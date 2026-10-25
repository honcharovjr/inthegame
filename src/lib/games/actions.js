"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSingleEmoji } from "./emoji";
import { GAME_TYPES } from "./types";

// Adds a custom game. It belongs to its author and shows up next to the
// catalog games with a Custom chip. Input: { name, type, minPlayers,
// maxPlayers, duration, emoji } where duration and emoji are optional.
export async function createGame(input) {
  const name = String(input?.name ?? "").trim();
  const type = String(input?.type ?? "");
  const min = Number.parseInt(input?.minPlayers, 10);
  const max = Number.parseInt(input?.maxPlayers, 10);
  const emoji = String(input?.emoji ?? "").trim();
  const rawDuration = String(input?.duration ?? "").trim();
  const duration = rawDuration === "" ? null : Number.parseInt(rawDuration, 10);

  if (name.length < 1 || name.length > 60) {
    return { error: "Give the game a name of up to 60 characters." };
  }
  if (!GAME_TYPES.some((item) => item.value === type)) {
    return { error: "Pick a type for the game." };
  }
  if (emoji && !isSingleEmoji(emoji)) {
    return { error: "Use one emoji for the game." };
  }
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 50) {
    return { error: "Check the number of players." };
  }
  if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
    return { error: "Time must be between 1 and 1440 minutes." };
  }

  const { profile } = await getProfile();
  if (!profile) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .insert({
      name,
      type,
      emoji: emoji || null,
      min_players: min,
      max_players: max,
      typical_duration_min: duration,
      is_classic: false,
      created_by: profile.id,
    })
    .select(
      "id, name, type, emoji, is_classic, min_players, max_players, typical_duration_min, created_by",
    )
    .single();
  if (error) {
    console.error("createGame failed", error);
    return { error: "Could not add the game. Try again." };
  }

  revalidatePath("/games");
  return { game: data };
}
