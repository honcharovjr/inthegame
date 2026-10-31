import { getProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// An online room for its page, or null when it does not exist or the player
// is not in it. The room and its rows are read as the player, so Row Level
// Security decides. Names come through the service role: invited players
// may not share a team with each other, so they cannot read each other's
// profiles directly.
export async function loadRoom(id, gameKey) {
  const { profile } = await getProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const [roomResult, playersResult] = await Promise.all([
    supabase.from("game_rooms").select("*").eq("id", id).maybeSingle(),
    supabase.from("game_room_players").select("*").eq("room_id", id),
  ]);
  const room = roomResult.data;
  if (!room || room.game_key !== gameKey || !playersResult.data) return null;

  const { data: profiles } = await createAdminClient()
    .from("profiles")
    .select("id, nickname, character")
    .in("id", playersResult.data.map((row) => row.profile_id));

  const players = playersResult.data.map((row) => {
    const person = profiles?.find((item) => item.id === row.profile_id);
    return { ...row, nickname: person?.nickname ?? "Player", character: person?.character ?? null };
  });

  return { me: profile.id, room, players };
}
