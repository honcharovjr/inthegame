"use server";

import { revalidatePath } from "next/cache";
import { checkPlayer } from "@/lib/achievements/award";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { validateCharacter } from "./items";

// Saves the character of the signed-in player. The choice is checked against
// the achievements the player has really earned, so a locked item cannot be
// worn by calling this action with a made-up value.
export async function saveCharacter(input) {
  const { profile } = await getProfile();
  if (!profile) {
    return { error: "Your profile is missing. Log out and in again." };
  }

  // Bring the achievements up to date first, so one earned a moment ago counts.
  let earned;
  try {
    const { results } = await checkPlayer(profile.id);
    earned = new Set(results.filter((r) => r.earned).map((r) => r.code));
  } catch (error) {
    console.error("saveCharacter check failed", error);
    return { error: "Could not check your achievements. Try again." };
  }

  const checked = validateCharacter(input, earned);
  if (checked.error) return { error: checked.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ character: checked.character })
    .eq("id", profile.id);
  if (error) {
    console.error("saveCharacter failed", error);
    return { error: "Could not save. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
