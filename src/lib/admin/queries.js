import { dashboardStats } from "@/lib/stats/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Data for the admin panel. These read across all players with the service
// role, so call them only after requireSuperAdmin(). Server-side only.

const WEEKS = 8;
const GAME_COLUMNS =
  "id, name, description, type, emoji, is_classic, min_players, max_players, typical_duration_min, created_by, created_at";

function count(result) {
  return result.count ?? 0;
}

export async function loadDashboard(now = Date.now()) {
  const admin = createAdminClient();
  const since = new Date(now - WEEKS * 7 * 24 * 60 * 60 * 1000).toISOString();

  const [players, sessionsTotal, catalog, teams, profiles, sessions, participants, games, audit] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("sessions").select("id", { count: "exact", head: true }),
      admin.from("games").select("id", { count: "exact", head: true }).is("created_by", null),
      admin.from("teams").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id, created_at").gte("created_at", since),
      admin.from("sessions").select("id, game_id, created_by, played_at").gte("played_at", since),
      admin
        .from("session_participants")
        .select("session_id, profile_id, sessions!inner(played_at)")
        .gte("sessions.played_at", since),
      admin.from("games").select("id, name"),
      loadAudit(admin, 8),
    ]);

  const failed = [profiles, sessions, participants, games].find((r) => r.error);
  if (failed) throw failed.error;

  return {
    totals: {
      players: count(players),
      sessions: count(sessionsTotal),
      catalog: count(catalog),
      teams: count(teams),
    },
    stats: dashboardStats({
      profiles: profiles.data,
      sessions: sessions.data,
      participants: participants.data,
      games: games.data,
      now,
      weeks: WEEKS,
    }),
    audit,
  };
}

async function loadAudit(admin, limit) {
  const { data } = await admin
    .from("admin_audit")
    .select("id, action, target_type, details, created_at, profiles(nickname)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Catalog games with how many sessions use them, and players' custom games
// that could join the catalog.
export async function loadCatalog() {
  const admin = createAdminClient();
  const [catalog, custom] = await Promise.all([
    admin
      .from("games")
      .select(`${GAME_COLUMNS}, sessions(count)`)
      .is("created_by", null)
      .order("name"),
    admin
      .from("games")
      .select(`${GAME_COLUMNS}, sessions(count), profiles(nickname)`)
      .not("created_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (catalog.error) throw catalog.error;
  if (custom.error) throw custom.error;

  const withCount = (game) => ({
    ...game,
    sessionsCount: game.sessions?.[0]?.count ?? 0,
    author: game.profiles?.nickname ?? null,
  });
  return {
    catalog: catalog.data.map(withCount),
    custom: custom.data.map(withCount),
  };
}

// The login accounts, keyed by auth user id. One page of 1000 covers the
// pilot; page through when there are more players.
async function loadAccounts(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return new Map(data.users.map((user) => [user.id, user]));
}

export function isBanned(account, now = Date.now()) {
  return Boolean(account?.banned_until) && Date.parse(account.banned_until) > now;
}

export async function loadUsers() {
  const admin = createAdminClient();
  const [profiles, accounts, played, memberships] = await Promise.all([
    admin
      .from("profiles")
      .select("id, user_id, nickname, character, is_super_admin, created_at")
      .order("created_at", { ascending: false }),
    loadAccounts(admin),
    admin.from("session_participants").select("profile_id").not("profile_id", "is", null),
    admin.from("team_members").select("profile_id"),
  ]);
  if (profiles.error) throw profiles.error;

  const tally = (rows) => {
    const map = new Map();
    for (const row of rows ?? []) map.set(row.profile_id, (map.get(row.profile_id) ?? 0) + 1);
    return map;
  };
  const sessionsBy = tally(played.data);
  const teamsBy = tally(memberships.data);

  return profiles.data.map((profile) => {
    const account = accounts.get(profile.user_id);
    return {
      id: profile.id,
      nickname: profile.nickname,
      character: profile.character,
      isAdmin: profile.is_super_admin,
      createdAt: profile.created_at,
      email: account?.email ?? null,
      lastSignIn: account?.last_sign_in_at ?? null,
      blocked: isBanned(account),
      deleted: !profile.user_id,
      sessions: sessionsBy.get(profile.id) ?? 0,
      teams: teamsBy.get(profile.id) ?? 0,
    };
  });
}

export async function loadUser(profileId) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, user_id, nickname, character, is_super_admin, created_at")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return null;

  const [account, sessionsCount, recent, teams, ratings, achievements] = await Promise.all([
    profile.user_id
      ? admin.auth.admin.getUserById(profile.user_id).then((r) => r.data?.user ?? null)
      : null,
    admin
      .from("session_participants")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId),
    admin
      .from("sessions")
      .select("id, played_at, games(name), session_participants!inner(place, score, profile_id)")
      .eq("session_participants.profile_id", profileId)
      .order("played_at", { ascending: false })
      .limit(10),
    admin.from("team_members").select("role, joined_at, teams(id, name)").eq("profile_id", profileId),
    admin
      .from("ratings")
      .select("rating, games_count, games(name)")
      .eq("profile_id", profileId)
      .order("rating", { ascending: false }),
    admin
      .from("user_achievements")
      .select("achievement_id", { count: "exact", head: true })
      .eq("profile_id", profileId),
  ]);

  return {
    id: profile.id,
    nickname: profile.nickname,
    character: profile.character,
    isAdmin: profile.is_super_admin,
    createdAt: profile.created_at,
    deleted: !profile.user_id,
    email: account?.email ?? null,
    lastSignIn: account?.last_sign_in_at ?? null,
    blocked: isBanned(account),
    sessions: count(sessionsCount),
    achievements: count(achievements),
    recent: (recent.data ?? []).map((row) => ({
      id: row.id,
      playedAt: row.played_at,
      game: row.games?.name ?? "Unknown game",
      place: row.session_participants[0]?.place,
      score: row.session_participants[0]?.score ?? null,
    })),
    teams: (teams.data ?? [])
      .filter((row) => row.teams)
      .map((row) => ({ id: row.teams.id, name: row.teams.name, role: row.role })),
    ratings: (ratings.data ?? []).map((row) => ({
      game: row.games?.name ?? "Unknown game",
      rating: Math.round(Number(row.rating)),
      games: row.games_count,
    })),
  };
}
