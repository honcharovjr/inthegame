"use server";

import { revalidatePath } from "next/cache";
import { validateGameInput } from "@/lib/games/validate";
import { rebuildGameRatings } from "@/lib/rating/rebuild";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminProfile } from "./access";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = { error: "Only super admins can do this." };
// Supabase Auth has no "forever", so a block lasts 100 years.
const BLOCK_FOR = "876000h";

async function audit(admin, adminId, action, targetType, targetId, details) {
  const { error } = await admin.from("admin_audit").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
  if (error) console.error("admin audit failed", error);
}

function refreshCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/catalog");
  revalidatePath("/games/track");
}

// Adds a catalog game, or edits one when input.id is given. Custom games
// are never edited here; they belong to their authors.
export async function saveCatalogGame(input) {
  const me = await adminProfile();
  if (!me) return NOT_ALLOWED;

  const checked = validateGameInput(input);
  if (checked.error) return { error: checked.error };
  const row = { ...checked.game, is_classic: Boolean(input?.isClassic) };
  const id = input?.id ? String(input.id) : null;
  if (id && !UUID.test(id)) return { error: "This game was not found." };

  const admin = createAdminClient();
  const query = id
    ? admin.from("games").update(row).eq("id", id).is("created_by", null)
    : admin.from("games").insert({ ...row, created_by: null });
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) {
    console.error("saveCatalogGame failed", error);
    return { error: "Could not save the game. Try again." };
  }

  await audit(admin, me.id, id ? "game.edit" : "game.add", "game", data.id, { name: row.name });
  refreshCatalog();
  return { ok: true };
}

// Deletes a catalog game that no session uses.
export async function deleteCatalogGame(id) {
  const me = await adminProfile();
  if (!me) return NOT_ALLOWED;
  if (!UUID.test(String(id))) return { error: "This game was not found." };

  const admin = createAdminClient();
  const { count } = await admin
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("game_id", id);
  if (count) return { error: "Sessions use this game, so it cannot be deleted." };

  const { data, error } = await admin
    .from("games")
    .delete()
    .eq("id", id)
    .is("created_by", null)
    .select("name")
    .maybeSingle();
  if (error || !data) {
    console.error("deleteCatalogGame failed", error);
    return { error: "Could not delete the game. Try again." };
  }

  await audit(admin, me.id, "game.delete", "game", id, { name: data.name });
  refreshCatalog();
  return { ok: true };
}

// Moves a player's custom game into the catalog, so everyone sees it.
export async function promoteGame(id) {
  const me = await adminProfile();
  if (!me) return NOT_ALLOWED;
  if (!UUID.test(String(id))) return { error: "This game was not found." };

  const admin = createAdminClient();
  const { data: game } = await admin
    .from("games")
    .select("name, created_by")
    .eq("id", id)
    .not("created_by", "is", null)
    .maybeSingle();
  if (!game) return { error: "This game was not found." };

  const { error } = await admin.from("games").update({ created_by: null }).eq("id", id);
  if (error) {
    console.error("promoteGame failed", error);
    return { error: "Could not add the game to the catalog. Try again." };
  }

  await audit(admin, me.id, "game.promote", "game", id, {
    name: game.name,
    author: game.created_by,
  });
  refreshCatalog();
  return { ok: true };
}

// Blocks or unblocks a player's login. A blocked player cannot log in, and
// their current login stops working when it next needs a refresh (at most
// about an hour). Their sessions and history stay.
export async function setBlocked(profileId, blocked) {
  const me = await adminProfile();
  if (!me) return NOT_ALLOWED;
  if (!UUID.test(String(profileId))) return { error: "This player was not found." };
  if (profileId === me.id) return { error: "You cannot block yourself." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("user_id, nickname, is_super_admin")
    .eq("id", profileId)
    .maybeSingle();
  if (!target?.user_id) return { error: "This player has no account to block." };
  if (target.is_super_admin) return { error: "Super admins cannot be blocked." };

  const { error } = await admin.auth.admin.updateUserById(target.user_id, {
    ban_duration: blocked ? BLOCK_FOR : "none",
  });
  if (error) {
    console.error("setBlocked failed", error);
    return { error: "Could not change the block. Try again." };
  }

  await audit(admin, me.id, blocked ? "player.block" : "player.unblock", "profile", profileId, {
    nickname: target.nickname,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${profileId}`);
  return { ok: true };
}

// Recomputes the ratings of every game from its sessions, for example after
// a change to the rating rules (change C23). Games are rebuilt one by one.
export async function rebuildAllRatings() {
  const me = await adminProfile();
  if (!me) return NOT_ALLOWED;

  const admin = createAdminClient();
  const { data: games, error } = await admin.from("games").select("id");
  if (error) {
    console.error("rebuildAllRatings failed", error);
    return { error: "Could not read the games. Try again." };
  }

  for (const game of games) {
    try {
      await rebuildGameRatings(game.id);
    } catch (rebuildError) {
      console.error("rebuildAllRatings failed on a game", game.id, rebuildError);
      return { error: "Some ratings could not be rebuilt. Try again." };
    }
  }

  await audit(admin, me.id, "ratings.rebuild", "game", null, { name: `${games.length} games` });
  revalidatePath("/", "layout");
  return { ok: true };
}
