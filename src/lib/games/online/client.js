"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Browser side of online rooms (FR-45): calls to the room routes, and hooks
// that follow a room or the player's invites through Supabase Realtime.
// Nothing here polls the server; the clock below only redraws countdowns.

async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return response.ok ? data : { error: data.error ?? "Something went wrong. Try again", status: response.status };
}

// Answers { id } or { error }.
export function createRoom(gameKey, invitees) {
  return post("/api/rooms", { gameKey, invitees });
}

// Answers { room } or { error, status }.
export function roomAction(roomId, body) {
  return post(`/api/rooms/${roomId}`, body);
}

// The current time, redrawn every interval while mounted.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

// Opens a Realtime channel as the logged-in player. Realtime applies the
// read policies with the token it has when the channel joins, so the
// session is loaded and handed over first; otherwise the channel joins as
// anonymous and receives nothing. listen adds the .on() handlers.
// Answers a function that closes the channel.
function follow(supabase, name, listen) {
  let channel = null;
  let closed = false;
  (async () => {
    await supabase.auth.getSession();
    await supabase.realtime.setAuth();
    if (closed) return;
    channel = listen(supabase.channel(name)).subscribe((status, error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("realtime channel failed", name, status, error);
      }
    });
  })();
  return () => {
    closed = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// Calls back when the player returns to the tab, so anything Realtime
// missed while the device slept is read once. Not polling.
function onReturn(callback) {
  const handler = () => {
    if (document.visibilityState === "visible") callback();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}

// A room and its player rows, kept fresh by Realtime. Starts from what the
// page loaded on the server. reload reads both again, for example after a
// conflict.
export function useRoom(initialRoom, initialPlayers) {
  const [room, setRoom] = useState(initialRoom);
  const [players, setPlayers] = useState(initialPlayers);
  const roomId = initialRoom.id;

  // Takes rows read from the database. Names stay from the first load.
  const take = useCallback((nextRoom, rows) => {
    if (nextRoom) setRoom(nextRoom);
    if (rows) {
      setPlayers((current) =>
        current.map((item) => ({ ...item, ...rows.find((row) => row.profile_id === item.profile_id) })),
      );
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const stop = follow(supabase, `room:${roomId}`, (channel) =>
      channel
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
          ({ new: row }) => setRoom((current) => (row.version >= current.version ? row : current)),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "game_room_players", filter: `room_id=eq.${roomId}` },
          ({ new: row }) => take(null, [row]),
        ),
    );
    const stopReturn = onReturn(async () => take(...(await readRoom(supabase, roomId))));
    return () => {
      stop();
      stopReturn();
    };
  }, [roomId, take]);

  const reload = useCallback(async () => {
    take(...(await readRoom(createClient(), roomId)));
  }, [roomId, take]);

  // An answer from a room route is newer than what Realtime has sent so far.
  const applyRoom = useCallback((next) => {
    setRoom((current) => (next.version >= current.version ? { ...current, ...next } : current));
  }, []);

  return { room, players, reload, applyRoom };
}

// [room, player rows]; either is null when it could not be read.
async function readRoom(supabase, roomId) {
  const [roomResult, playersResult] = await Promise.all([
    supabase.from("game_rooms").select("*").eq("id", roomId).maybeSingle(),
    supabase.from("game_room_players").select("*").eq("room_id", roomId),
  ]);
  return [roomResult.data, playersResult.data];
}

// The player's open invites and running games, newest first. Each item:
// { roomId, gameKey, status ("invited" or "joined"), invitedAt, roomStatus,
//   host: { nickname, character } }. Null until the first read.
export function useMyRooms(profileId) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("game_room_players")
        // Rooms reach profiles both through the host and through the player
        // rows, so the host link is named.
        .select(
          "room_id, status, invited_at, game_rooms!inner(game_key, status, profiles!game_rooms_host_id_fkey(nickname, character))",
        )
        .eq("profile_id", profileId)
        .in("status", ["invited", "joined"])
        .in("game_rooms.status", ["waiting", "playing"])
        .order("invited_at", { ascending: false })
        .limit(10);
      if (!active || error) return;
      setItems(
        data.map((row) => ({
          roomId: row.room_id,
          gameKey: row.game_rooms.game_key,
          status: row.status,
          invitedAt: row.invited_at,
          roomStatus: row.game_rooms.status,
          host: row.game_rooms.profiles ?? { nickname: "Player", character: null },
        })),
      );
    }

    load();
    // Any change to the player's own rows: a new invite, an answer, a start
    // or a cancel (both also update the invite rows).
    const stop = follow(supabase, `my-rooms:${profileId}`, (channel) =>
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_room_players", filter: `profile_id=eq.${profileId}` },
        load,
      ),
    );
    const stopReturn = onReturn(load);
    return () => {
      active = false;
      stop();
      stopReturn();
    };
  }, [profileId]);

  return items;
}

// "14:05" for a countdown in milliseconds.
export function clock(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
