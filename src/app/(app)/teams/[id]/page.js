import BackButton from "@/components/BackButton/BackButton";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import MetaLine from "@/components/MetaLine/MetaLine";
import UserText from "@/components/UserText/UserText";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { playerColor } from "@/lib/sessions/colors";
import { loadPanelSessions, readPage } from "@/lib/sessions/panel";
import { teamLeaderboard } from "@/lib/stats/leaderboard";
import { leaveTeam } from "@/lib/teams/actions";
import { createClient } from "@/lib/supabase/server";
import SessionHistory from "../SessionHistory";
import CopyLink from "./CopyLink";
import InviteToggle from "./InviteToggle";
import styles from "../teams.module.css";

export const metadata = { title: "team" };

const UUID = /^[0-9a-f-]{36}$/i;

export default function TeamPage({ params, searchParams }) {
  return (
    <main className={styles.page}>
      <BackButton fallback="/teams" />
      <Link href="/teams" className={styles.backLink}>
        All teams
      </Link>
      <Suspense fallback={<TeamSkeleton />}>
        <TeamContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function TeamSkeleton() {
  return (
    <div className={styles.body}>
      <Skeleton width={260} height={44} />
      <Skeleton height={90} radius={22} delay={80} />
      <Skeleton height={180} radius={22} delay={160} />
    </div>
  );
}

// Reads the session, the address and the database, so it streams in.
async function TeamContent({ params, searchParams }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const page = readPage((await searchParams).page);

  const { profile } = await getProfile();
  const supabase = await createClient();

  const [teamResult, membersResult, sessionsResult, history] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, owner_id, invite_code, invite_enabled")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("role, profile_id, profiles(nickname, character)")
      .eq("team_id", id),
    supabase
      .from("sessions")
      .select("id, session_participants(place, profile_id)")
      .eq("team_id", id)
      .order("played_at", { ascending: false })
      .limit(500),
    loadPanelSessions(supabase, { teamId: id, page }),
  ]);

  const team = teamResult.data;
  if (!team) notFound();

  const isOwner = team.owner_id === profile?.id;
  const members = (membersResult.data ?? []).map((row) => ({
    id: row.profile_id,
    name: row.profiles?.nickname ?? "Player",
    character: row.profiles?.character ?? null,
    role: row.role,
  }));

  const sessions = sessionsResult.data ?? [];
  const board = teamLeaderboard(
    sessions.map((session) => ({
      participants: session.session_participants.map((p) => ({
        profileId: p.profile_id,
        place: p.place,
      })),
    })),
    members,
  );

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const link = `${protocol}://${host}/join/${team.invite_code}`;

  return (
    <div className={`${styles.body} stagger`}>
      <h1 className={`${styles.title} keep-case`}>{team.name}</h1>

      <section className={styles.card} aria-label="Members">
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Members</span>
          <span className={styles.count}>{members.length}</span>
        </div>
        <ul className={styles.members} style={{ marginTop: 10 }}>
          {members.map((member, index) => (
            <li key={member.id} className={styles.member}>
              <Avatar
                name={member.name}
                size={32}
                color={playerColor(index)}
                registered
                character={member.character}
              />
              <UserText>{member.name}</UserText>
              {member.role === "owner" && (
                <Chip size="s" tone="pink">
                  Owner
                </Chip>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card} aria-label="Invite">
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Invite friends</span>
          <InviteToggle teamId={team.id} enabled={team.invite_enabled} canEdit={isOwner} />
        </div>
        <div className={styles.invite} style={{ marginTop: 10 }}>
          {team.invite_enabled && (
            <>
              <span className={styles.inviteLink}>
                <span className={styles.inviteText}>{link}</span>
              </span>
              <CopyLink link={link} />
            </>
          )}
        </div>
      </section>

      <section className={styles.card} aria-label="Leaderboard">
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Leaderboard</span>
          <Link
            href={`/teams/${team.id}/stats`}
            className={`${styles.statsLink} btn-secondary btn-tilt`}
          >
            Full stats
          </Link>
        </div>
        <ol className={styles.board}>
          {board.map((row, index) => (
            <li key={row.id} className={styles.boardRow}>
              <span
                className={styles.rank}
                style={{ color: index === 0 && row.wins > 0 ? "var(--color-pink-deep)" : undefined }}
              >
                {index + 1}
              </span>
              <Avatar
                name={row.name}
                size={36}
                color={playerColor(index)}
                registered
                character={members.find((m) => m.id === row.id)?.character}
              />
              <span className={`${styles.boardName} keep-case`}>{row.name}</span>
              <MetaLine
                className={styles.boardMeta}
                items={[
                  `${row.games} ${row.games === 1 ? "game" : "games"}`,
                  <span key="wins" className={styles.winner}>
                    {row.wins} {row.wins === 1 ? "win" : "wins"}
                  </span>,
                ]}
              />
            </li>
          ))}
        </ol>
      </section>

      <SessionHistory
        title="Team history"
        sessions={history.sessions}
        profileId={profile?.id}
        page={page}
        totalPages={history.totalPages}
        pageHref={(next) => `/teams/${team.id}${next > 1 ? `?page=${next}` : ""}`}
        empty="No sessions in this team yet. Log one and pick this team."
      />

      <div className={styles.leave}>
        <ConfirmButton
          title="Leave this team?"
          message={
            <>
              You will stop seeing <UserText>{team.name}</UserText> and its sessions. You can
              rejoin with an invite link.
            </>
          }
          confirmLabel="Leave team"
          triggerLabel="Leave team"
          action={leaveTeam.bind(null, team.id)}
        />
      </div>
    </div>
  );
}
