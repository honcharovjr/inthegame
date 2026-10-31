"use client";

import { useEffect, useState } from "react";
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

// A room and its player rows, kept fresh by Realtime. Starts from what the
// page loaded on the server. reload reads both again, for example after a
// conflict.
export function useRoom(initialRoom, initialPlayers) {
  const [room, setRoom] = useState(initialRoom);
  const [players, setPlayers] = useState(initialPlayers);
  const roomId = initialRoom.id;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        ({ new: row }) => setRoom((current) => (row.version >= current.version ? row : current)),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_room_players", filter: `room_id=eq.${roomId}` },
        ({ new: row }) =>
          setPlayers((current) =>
            current.map((item) => (item.profile_id === row.profile_id ? { ...item, ...row } : item)),
          ),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function reload() {
    const supabase = createClient();
    const [roomResult, playersResult] = await Promise.all([
      supabase.from("game_rooms").select("*").eq("id", roomId).maybeSingle(),
      supabase.from("game_room_players").select("*").eq("room_id", roomId),
    ]);
    if (roomResult.data) setRoom(roomResult.data);
    if (playersResult.data) {
      setPlayers((current) =>
        current.map((item) => ({
          ...item,
          ...playersResult.data.find((row) => row.profile_id === item.profile_id),
        })),
      );
    }
  }

  // An answer from a room route is newer than what Realtime has sent so far.
  function applyRoom(next) {
    setRoom((current) => (next.version >= current.version ? { ...current, ...next } : current));
  }

  return { room, players, reload, applyRoom };
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
        .select("room_id, status, invited_at, game_rooms!inner(game_key, status, profiles(nickname, character))")
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
    const channel = supabase
      .channel(`my-rooms:${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_room_players", filter: `profile_id=eq.${profileId}` },
        load,
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return items;
}

// "14:05" for a countdown in milliseconds.
export function clock(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
