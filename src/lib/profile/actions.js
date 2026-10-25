"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

// Changes the player's nickname. The form keeps what was typed on an error.
export async function updateNickname(previousState, formData) {
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname.length < 2 || nickname.length > 30) {
    return { error: "Use 2 to 30 characters.", values: { nickname } };
  }

  const { profile } = await getProfile();
  if (!profile) {
    return { error: "Your profile is missing.", values: { nickname } };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", profile.id);
  if (error) {
    console.error("updateNickname failed", error);
    return { error: "Could not save. Try again.", values: { nickname } };
  }

  revalidatePath("/", "layout");
  return { notice: "Nickname saved.", values: { nickname } };
}

// Removes a guest. A guest who took part in a session stays, because the
// history of that session must keep its players.
export async function deleteGuest(guestId) {
  if (!UUID.test(String(guestId))) {
    return { error: "Unknown guest." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId)
    .select("id");

  if (error) {
    // 23503: the guest is still used by a session.
    return {
      error:
        error.code === "23503"
          ? "This guest played in a session, so they cannot be removed."
          : "Could not remove the guest. Try again.",
    };
  }
  if (!data?.length) {
    return { error: "Unknown guest." };
  }

  revalidatePath("/profile");
  return { ok: true };
}
