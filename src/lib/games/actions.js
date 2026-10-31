"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validateGameInput } from "./validate";

// Adds a custom game. It belongs to its author and shows up next to the
// catalog games with a Custom chip. Input: { name, type, minPlayers,
// maxPlayers, duration, emoji } where duration and emoji are optional.
export async function createGame(input) {
  const checked = validateGameInput(input);
  if (checked.error) return { error: checked.error };

  const { profile } = await getProfile();
  if (!profile) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .insert({ ...checked.game, is_classic: false, created_by: profile.id })
    .select(
      "id, name, type, emoji, is_classic, min_players, max_players, typical_duration_min, created_by",
    )
    .single();
  if (error) {
    console.error("createGame failed", error);
    return { error: "Could not add the game. Try again." };
  }

  revalidatePath("/app/games/track");
  return { game: data };
}
