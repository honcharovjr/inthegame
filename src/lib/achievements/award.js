import { createAdminClient } from "@/lib/supabase/admin";
import { teamLeaderboard } from "@/lib/stats/leaderboard";
import { evaluateAchievements } from "./evaluate";

const PAGE = 500;
const CHUNK = 150;

// Server side only. Reads the whole history of one player with the service
// role key and turns it into the input of evaluateAchievements.
async function loadInput(admin, profileId) {
  const me = `p:${profileId}`;

  // The player's confirmed sessions, oldest first, in pages.
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("sessions")
      .select(
        "id, played_at, created_at, game_id, team_id, games(created_by), session_participants(profile_id, guest_id, place), mine:session_participants!inner(profile_id)",
      )
      .eq("mine.profile_id", profileId)
      .eq("status", "confirmed")
      .order("played_at")
      .order("created_at")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  const key = (p) => (p.profile_id ? `p:${p.profile_id}` : `g:${p.guest_id}`);
  const sessions = rows.map((row) => ({
    id: row.id,
    playedAt: row.played_at,
    gameId: row.game_id,
    teamId: row.team_id,
    gameCreatedBy: row.games?.created_by ?? null,
    participants: row.session_participants.map((p) => ({ key: key(p), place: p.place })),
  }));

  // Ratings now, and every rating from before each of those sessions.
  const { data: ratingRows, error: ratingError } = await admin
    .from("ratings")
    .select("game_id, rating, games_count")
    .eq("profile_id", profileId);
  if (ratingError) throw ratingError;

  const ratingBefore = {};
  for (let i = 0; i < sessions.length; i += CHUNK) {
    const ids = sessions.slice(i, i + CHUNK).map((s) => s.id);
    const { data, error } = await admin
      .from("rating_history")
      .select("session_id, profile_id, guest_id, rating_before")
      .in("session_id", ids);
    if (error) throw error;
    for (const row of data) {
      ratingBefore[`${row.session_id}|${key(row)}`] = Number(row.rating_before);
    }
  }

  // Teams of the player: size, activity and who leads the leaderboard.
  const { data: memberships, error: teamError } = await admin
    .from("team_members")
    .select("teams(id, owner_id, team_members(profile_id, profiles(nickname)))")
    .eq("profile_id", profileId);
  if (teamError) throw teamError;

  const teams = [];
  for (const membership of memberships ?? []) {
    const team = membership.teams;
    if (!team) continue;
    const members = team.team_members.map((m) => ({
      id: m.profile_id,
      name: m.profiles?.nickname ?? "Player",
    }));
    const { data: teamSessions, error } = await admin
      .from("sessions")
      .select("session_participants(profile_id, place)")
      .eq("team_id", team.id)
      .eq("status", "confirmed")
      .limit(PAGE);
    if (error) throw error;
    const board = teamLeaderboard(
      teamSessions.map((s) => ({
        participants: s.session_participants.map((p) => ({
          profileId: p.profile_id,
          place: p.place,
        })),
      })),
      members,
    );
    teams.push({
      ownedByMe: team.owner_id === profileId,
      memberCount: members.length,
      sessionCount: teamSessions.length,
      leaderKey: board[0]?.wins > 0 ? `p:${board[0].id}` : null,
    });
  }

  return {
    me,
    sessions,
    ratings: (ratingRows ?? []).map((row) => ({
      gameId: row.game_id,
      rating: Number(row.rating),
      gamesCount: row.games_count,
    })),
    ratingBefore,
    teams,
  };
}

// Server side only. Checks the achievements of one player and stores the ones
// just earned. Earned achievements are never taken back. Returns
// { results, fresh } with the progress of every achievement and the codes
// earned just now.
export async function checkPlayer(profileId, admin = createAdminClient()) {
  const results = evaluateAchievements(await loadInput(admin, profileId));

  const { data: catalog, error: catalogError } = await admin
    .from("achievements")
    .select("id, code");
  if (catalogError) throw catalogError;
  const idByCode = new Map(catalog.map((row) => [row.code, row.id]));

  const { data: have, error } = await admin
    .from("user_achievements")
    .select("achievements(code)")
    .eq("profile_id", profileId);
  if (error) throw error;
  const owned = new Set(have.map((row) => row.achievements?.code));

  const fresh = results.filter((r) => r.earned && !owned.has(r.code));
  if (fresh.length) {
    const { error: insertError } = await admin.from("user_achievements").upsert(
      fresh.map((r) => ({
        profile_id: profileId,
        achievement_id: idByCode.get(r.code),
      })),
      { onConflict: "profile_id,achievement_id", ignoreDuplicates: true },
    );
    if (insertError) throw insertError;
  }
  return { results, fresh: fresh.map((r) => r.code) };
}

// Server side only. Checks several players after a session. A failure for one
// player must not stop the others, so errors are logged.
export async function awardAchievements(profileIds) {
  const admin = createAdminClient();
  const added = {};
  for (const profileId of new Set(profileIds)) {
    try {
      added[profileId] = (await checkPlayer(profileId, admin)).fresh;
    } catch (error) {
      console.error("awardAchievements failed", profileId, error);
      added[profileId] = [];
    }
  }
  return added;
}
