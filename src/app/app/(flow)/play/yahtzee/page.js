import { Suspense } from "react";
import { findPlayable } from "@/lib/games/playable";
import { loadPlayers } from "../shared/loadPlayers";
import ui from "../shared/play.module.css";
import YahtzeeGame from "./YahtzeeGame";

export const metadata = { title: "yahtzee" };

const GAME = findPlayable("yahtzee");

export default function YahtzeePage() {
  return (
    <Suspense fallback={<main className={ui.page} />}>
      <YahtzeeData />
    </Suspense>
  );
}

async function YahtzeeData() {
  const { profile, guests, teams } = await loadPlayers();

  if (!profile) {
    return (
      <main className={ui.page}>
        <p role="alert" className={ui.problem}>
          Could not open Yahtzee. Reload the page.
        </p>
      </main>
    );
  }

  return <YahtzeeGame profile={profile} initialGuests={guests} teams={teams} maxPlayers={GAME.maxPlayers} />;
}
