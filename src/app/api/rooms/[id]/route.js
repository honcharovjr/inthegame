import { NextResponse } from "next/server";
import { ONLINE_GAMES } from "@/lib/games/online/adapters";
import {
  RoomError,
  advance,
  applyMove,
  hostAction,
  inviteExpired,
  requestEnd,
  startState,
} from "@/lib/games/online/room";
import {
  errorResponse,
  loadRoom,
  saveRoom,
  serverRandom,
  setPlayerStatus,
} from "@/lib/games/online/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callerProfileId } from "@/lib/supabase/request";

// One action on a room (FR-45). Body: { action, version, ... }.
// Before the game: accept, decline, cancel, start.
// During the game: move ({ move }), request_end, the host's end, keep, wait,
// resume and remove, and tick, which a device sends when a deadline has
// passed. Moves and host actions name the
// room version the device saw, so nobody acts on an old view.
// Answers { room: { id, status, version, state } }.
export async function POST(request, ctx) {
  try {
    const caller = await callerProfileId(request);
    if (!caller) throw new RoomError("Log in first", 401);

    const { id } = await ctx.params;
    const { room, players } = await loadRoom(id);
    const me = players.find((row) => row.profile_id === caller);
    if (!me) throw new RoomError("This game was not found", 404);

    const body = await request.json().catch(() => ({}));
    const adapter = ONLINE_GAMES[room.game_key];
    const now = Date.now();
    const isHost = caller === room.host_id;

    if (room.status === "waiting") {
      return NextResponse.json({ room: await beforeGame(body.action, room, players, me, isHost, adapter, now) });
    }
    if (room.status !== "playing") throw new RoomError("The game is over", 409);

    const advanced = advance(adapter, room.state, now, serverRandom);
    let state = advanced;
    try {
      if (body.action !== "tick" && body.version !== room.version) {
        throw new RoomError("The game changed. Reload it", 409);
      }
      if (body.action === "move") {
        state = applyMove(adapter, advanced, caller, body.move, now, serverRandom);
      } else if (body.action === "request_end") {
        state = requestEnd(advanced, caller, now);
      } else if (["end", "keep", "wait", "resume", "remove"].includes(body.action)) {
        state = hostAction(adapter, advanced, caller, body.action, now);
      } else if (body.action !== "tick") {
        throw new RoomError("Unknown action");
      }
    } catch (error) {
      // Deadlines that passed are saved even when the action is refused.
      if (advanced !== room.state) await saveState(adapter, room, advanced);
      throw error;
    }

    if (state === room.state) return NextResponse.json({ room: publicRoom(room) });
    return NextResponse.json({ room: await saveState(adapter, room, state) });
  } catch (error) {
    return errorResponse(error);
  }
}

async function beforeGame(action, room, players, me, isHost, adapter, now) {
  const joined = players.filter((row) => row.status === "joined");
  const pending = players.filter((row) => row.status === "invited").map((row) => row.profile_id);

  switch (action) {
    case "accept":
      if (me.status !== "invited") throw new RoomError("This invite was already answered", 409);
      if (inviteExpired(me.invited_at, now)) throw new RoomError("This invite has expired", 410);
      if (joined.length >= adapter.maxPlayers) throw new RoomError("This game is full", 409);
      await setPlayerStatus(room.id, [me.profile_id], "joined");
      return publicRoom(room);

    case "decline":
      if (me.status !== "invited") throw new RoomError("This invite was already answered", 409);
      await setPlayerStatus(room.id, [me.profile_id], "declined");
      return publicRoom(room);

    case "cancel": {
      if (!isHost) throw new RoomError("Only the host can do this", 403);
      const saved = await saveRoom(room, { status: "cancelled" });
      await setPlayerStatus(room.id, pending, "declined");
      return saved;
    }

    case "start": {
      if (!isHost) throw new RoomError("Only the host can do this", 403);
      if (joined.length < adapter.minPlayers) throw new RoomError("Wait until a friend joins", 409);
      // Host first, then in the order they joined.
      const order = [
        room.host_id,
        ...joined
          .filter((row) => row.profile_id !== room.host_id)
          .sort((a, b) => String(a.responded_at).localeCompare(String(b.responded_at)))
          .map((row) => row.profile_id),
      ];
      const saved = await saveRoom(room, {
        status: "playing",
        state: startState(adapter, room.host_id, order, now),
      });
      // Invites nobody answered end with the start.
      await setPlayerStatus(room.id, pending, "declined");
      await setSeats(room.id, order);
      return saved;
    }

    default:
      throw new RoomError("The game has not started yet", 409);
  }
}

async function saveState(adapter, room, state) {
  const saved = await saveRoom(room, { state, status: state.end?.status ?? "playing" });
  // Players no longer in the game were removed by the host.
  const left = new Set(adapter.players(state.game));
  const removed = adapter.players(room.state.game).filter((id) => !left.has(id));
  await setPlayerStatus(room.id, removed, "left");
  return saved;
}

async function setSeats(roomId, order) {
  const admin = createAdminClient();
  const results = await Promise.all(
    order.map((profileId, seat) =>
      admin
        .from("game_room_players")
        .update({ seat })
        .eq("room_id", roomId)
        .eq("profile_id", profileId),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
}

function publicRoom(room) {
  return { id: room.id, status: room.status, version: room.version, state: room.state };
}
