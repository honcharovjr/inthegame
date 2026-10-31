import { NextResponse } from "next/server";
import { ONLINE_GAMES } from "@/lib/games/online/adapters";
import { RoomError } from "@/lib/games/online/room";
import { UUID, errorResponse, teammatesOf } from "@/lib/games/online/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callerProfileId } from "@/lib/supabase/request";

// Creates a room and invites teammates (FR-45).
// Body: { gameKey, invitees: [profile id] }. Answers { id }.
export async function POST(request) {
  try {
    const host = await callerProfileId(request);
    if (!host) throw new RoomError("Log in first", 401);

    const body = await request.json().catch(() => ({}));
    const adapter = ONLINE_GAMES[body.gameKey];
    if (!adapter) throw new RoomError("This game cannot be played online");

    const invitees = [...new Set(Array.isArray(body.invitees) ? body.invitees : [])];
    if (
      invitees.length < 1 ||
      invitees.length > adapter.maxPlayers - 1 ||
      invitees.some((id) => !UUID.test(String(id)) || id === host)
    ) {
      throw new RoomError(`Invite 1 to ${adapter.maxPlayers - 1} friends`);
    }
    const teammates = await teammatesOf(host, invitees);
    if (invitees.some((id) => !teammates.has(id))) {
      throw new RoomError("You can only invite your teammates", 403);
    }

    const admin = createAdminClient();
    const { data: room, error } = await admin
      .from("game_rooms")
      .insert({ game_key: body.gameKey, host_id: host })
      .select("id")
      .single();
    if (error) throw error;

    // Every row names the same columns: in a multi-row insert, a column one
    // row leaves out becomes null, not its default.
    const now = new Date().toISOString();
    const { error: playersError } = await admin.from("game_room_players").insert([
      { room_id: room.id, profile_id: host, status: "joined", invited_at: now, responded_at: now },
      ...invitees.map((id) => ({
        room_id: room.id,
        profile_id: id,
        status: "invited",
        invited_at: now,
        responded_at: null,
      })),
    ]);
    if (playersError) {
      await admin.from("game_rooms").delete().eq("id", room.id);
      throw playersError;
    }

    return NextResponse.json({ id: room.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
