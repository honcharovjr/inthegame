"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// The name a deleted account leaves behind in other players' history.
const DELETED_NAME = "deleted player";

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

  revalidatePath("/app/profile");
  return { ok: true };
}

// Deletes the player's account (FR-05), as the privacy policy describes: the
// email and login are removed, and the profile stays as a nameless "deleted
// player", so sessions, ratings and leaderboards of friends stay correct.
// The profile row keeps no personal data: no nickname, character or avatar.
export async function deleteAccount() {
  const { profile } = await getProfile();
  if (!profile) return { error: "Your profile is missing." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Log in again, then try once more." };

  const admin = createAdminClient();
  const { error: anonymizeError } = await admin
    .from("profiles")
    .update({ nickname: DELETED_NAME, character: null, avatar_url: null })
    .eq("id", profile.id);
  if (anonymizeError) {
    console.error("deleteAccount anonymize failed", anonymizeError);
    return { error: "Could not delete your account. Try again." };
  }

  // Deleting the login also sets the profile's user_id to null (foreign key).
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("deleteAccount failed", deleteError);
    return { error: "Could not delete your account. Try again." };
  }

  // The login no longer exists; this only clears its cookies in this browser.
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/?account=deleted");
}
