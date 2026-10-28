import { Suspense } from "react";
import { getProfile } from "@/lib/auth/session";
import { findPlayable } from "@/lib/games/playable";
import { createClient } from "@/lib/supabase/server";
import YahtzeeGame from "./YahtzeeGame";
import styles from "./yahtzee.module.css";

export const metadata = { title: "Yahtzee" };

const GAME = findPlayable("yahtzee");

export default function YahtzeePage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <YahtzeeData />
    </Suspense>
  );
}

// Loads the players to choose from and the catalog game the result is saved
// to, in parallel, so the game itself never waits for the network.
async function YahtzeeData() {
  const { profile } = await getProfile();
  const supabase = await createClient();

  const [gameResult, guestsResult, teamsResult] = await Promise.all([
    supabase
      .from("games")
      .select("id")
      .eq("name", GAME.catalogName)
      .is("created_by", null)
      .limit(1),
    supabase
      .from("guests")
      .select("id, name")
      .eq("owner_id", profile?.id)
      .order("created_at"),
    supabase
      .from("team_members")
      .select("teams(id, name, team_members(profile_id, profiles(nickname, character)))")
      .eq("profile_id", profile?.id),
  ]);

  const gameId = gameResult.data?.[0]?.id;
  if (!profile || !gameId) {
    return (
      <main className={styles.page}>
        <p role="alert" className={styles.problem}>
          Could not open Yahtzee. Reload the page.
        </p>
      </main>
    );
  }

  const teams = (teamsResult.data ?? [])
    .filter((row) => row.teams)
    .map((row) => ({
      id: row.teams.id,
      name: row.teams.name,
      members: row.teams.team_members
        .filter((member) => member.profile_id !== profile.id)
        .map((member) => ({
          id: member.profile_id,
          nickname: member.profiles?.nickname ?? "Player",
          character: member.profiles?.character ?? null,
        })),
    }));

  return (
    <YahtzeeGame
      gameId={gameId}
      profile={{ id: profile.id, nickname: profile.nickname, character: profile.character ?? null }}
      initialGuests={guestsResult.data ?? []}
      teams={teams}
      minPlayers={GAME.minPlayers}
      maxPlayers={GAME.maxPlayers}
    />
  );
}
