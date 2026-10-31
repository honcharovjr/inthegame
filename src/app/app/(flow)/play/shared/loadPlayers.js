import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Who can join a game: your guests, and your teams with their members. Loaded
// on the server before the game opens, so the game never waits for the
// network. profile is null when the session could not be read.
export async function loadPlayers() {
  const { profile } = await getProfile();
  const supabase = await createClient();

  const [guestsResult, teamsResult] = await Promise.all([
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

  if (!profile) return { profile: null, guests: [], teams: [] };

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

  return {
    profile: { id: profile.id, nickname: profile.nickname, character: profile.character ?? null },
    guests: guestsResult.data ?? [],
    teams,
  };
}
