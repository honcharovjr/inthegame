"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

// Creates a team. The creator becomes its owner. Goes to the new team page.
export async function createTeam(previousState, formData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 60) {
    return { error: "Give the team a name of up to 60 characters.", values: { name } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_team", { p_name: name });
  if (error) {
    console.error("createTeam failed", error);
    return { error: "Could not create the team. Try again.", values: { name } };
  }

  revalidatePath("/app/teams");
  redirect(`/app/teams/${data}`);
}

// Joins a team with the code from an invite link.
export async function joinTeam(code) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_team", {
    p_code: String(code),
  });
  if (error) {
    return { error: "This invite link is not valid any more." };
  }

  revalidatePath("/app/teams");
  redirect(`/app/teams/${data}`);
}

// Leaves a team. The owner cannot leave while other members remain.
export async function leaveTeam(teamId) {
  if (!UUID.test(String(teamId))) {
    return { error: "Unknown team." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_team", { p_team_id: teamId });
  if (error) {
    return {
      error: error.message.includes("owner cannot leave")
        ? "You own this team, so you can only leave once everyone else has gone."
        : "Could not leave the team. Try again.",
    };
  }

  revalidatePath("/app/teams");
  redirect("/app/teams");
}

// The owner can switch the invite link off and on.
export async function setInviteEnabled(teamId, enabled) {
  if (!UUID.test(String(teamId))) {
    return { error: "Unknown team." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update({ invite_enabled: Boolean(enabled) })
    .eq("id", teamId)
    .select("id");
  if (error || !data?.length) {
    return { error: "Only the owner can change the invite link." };
  }

  revalidatePath(`/app/teams/${teamId}`);
  return { ok: true };
}
