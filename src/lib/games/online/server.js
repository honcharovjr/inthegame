import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoomError } from "./room";

// Server-side helpers for the room routes in src/app/api/rooms/. They use
// the service role, so callers must check who is asking first.

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Dice are rolled here, never on a device. Same shape as Math.random.
export function serverRandom() {
  return randomInt(0, 2 ** 32) / 2 ** 32;
}

// The room with its player rows, or a 404.
export async function loadRoom(id) {
  if (!UUID.test(String(id))) throw new RoomError("This game was not found", 404);
  const admin = createAdminClient();
  const [room, players] = await Promise.all([
    admin.from("game_rooms").select("*").eq("id", id).maybeSingle(),
    admin.from("game_room_players").select("*").eq("room_id", id),
  ]);
  if (room.error || players.error) throw room.error ?? players.error;
  if (!room.data) throw new RoomError("This game was not found", 404);
  return { room: room.data, players: players.data };
}

// Saves only if nobody changed the room since it was loaded. Otherwise the
// device has an old view and must reload.
export async function saveRoom(room, changes) {
  const { data, error } = await createAdminClient()
    .from("game_rooms")
    .update({ ...changes, version: room.version + 1, updated_at: new Date().toISOString() })
    .eq("id", room.id)
    .eq("version", room.version)
    .select("id, status, version, state")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new RoomError("The game changed. Reload it", 409);
  return data;
}

export async function setPlayerStatus(roomId, profileIds, status) {
  if (profileIds.length === 0) return;
  const { error } = await createAdminClient()
    .from("game_room_players")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .in("profile_id", profileIds);
  if (error) throw error;
}

// The ids among others that share at least one team with the host.
export async function teammatesOf(hostId, others) {
  const admin = createAdminClient();
  const { data: own, error } = await admin
    .from("team_members")
    .select("team_id")
    .eq("profile_id", hostId);
  if (error) throw error;
  if (own.length === 0) return new Set();

  const { data: shared, error: sharedError } = await admin
    .from("team_members")
    .select("profile_id")
    .in("team_id", own.map((row) => row.team_id))
    .in("profile_id", others);
  if (sharedError) throw sharedError;
  return new Set(shared.map((row) => row.profile_id));
}

// Turns a thrown error into the route's answer.
export function errorResponse(error) {
  if (error instanceof RoomError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("room route failed", error);
  return NextResponse.json({ error: "Something went wrong. Try again" }, { status: 500 });
}
