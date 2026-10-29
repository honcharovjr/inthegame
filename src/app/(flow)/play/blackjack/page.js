import { Suspense } from "react";
import { findPlayable } from "@/lib/games/playable";
import { loadPlayers } from "../shared/loadPlayers";
import ui from "../shared/play.module.css";
import BlackjackGame from "./BlackjackGame";

export const metadata = { title: "blackjack" };

const GAME = findPlayable("blackjack");

export default function BlackjackPage() {
  return (
    <Suspense fallback={<main className={ui.page} />}>
      <BlackjackData />
    </Suspense>
  );
}

async function BlackjackData() {
  const { profile, guests, teams } = await loadPlayers();

  if (!profile) {
    return (
      <main className={ui.page}>
        <p role="alert" className={ui.problem}>
          Could not open Blackjack. Reload the page.
        </p>
      </main>
    );
  }

  return <BlackjackGame profile={profile} initialGuests={guests} teams={teams} maxPlayers={GAME.maxPlayers} />;
}
