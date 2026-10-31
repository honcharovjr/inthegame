import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UUID } from "@/lib/games/online/server";
import Lobby from "../../../shared/Lobby";
import { loadRoom } from "../../../shared/loadRoom";
import ui from "../../../shared/play.module.css";

export const metadata = { title: "yahtzee" };

// An online Yahtzee game (FR-45): the lobby until the host starts it.
export default function YahtzeeRoomPage({ params }) {
  return (
    <Suspense fallback={<main className={ui.page} />}>
      <RoomData params={params} />
    </Suspense>
  );
}

async function RoomData({ params }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const data = await loadRoom(id, "yahtzee");
  if (!data) notFound();

  return <Lobby title="Yahtzee" me={data.me} initialRoom={data.room} initialPlayers={data.players} />;
}
