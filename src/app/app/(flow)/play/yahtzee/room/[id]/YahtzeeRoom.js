"use client";

import { useState } from "react";
import { useRoom } from "@/lib/games/online/client";
import Lobby, { Ended } from "../../../shared/Lobby";
import OnlineYahtzee from "../../OnlineYahtzee";

// One online Yahtzee room: the lobby, then the game once the host starts
// it. Both follow the same live room. serverNow is the server's clock when
// the page was made, so countdowns match the server even when this
// device's clock is off.
export default function YahtzeeRoom({ me, initialRoom, initialPlayers, serverNow }) {
  const roomState = useRoom(initialRoom, initialPlayers);
  const [offset] = useState(() => serverNow - Date.now());
  const { room } = roomState;

  if (room.status === "waiting") return <Lobby title="Yahtzee" me={me} roomState={roomState} />;
  if (!room.state) return <Ended title="Yahtzee">This game was cancelled.</Ended>;
  return <OnlineYahtzee me={me} roomState={roomState} offset={offset} />;
}
