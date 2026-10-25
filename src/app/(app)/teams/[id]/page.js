import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { playerColor } from "@/lib/sessions/colors";
import { teamLeaderboard } from "@/lib/stats/leaderboard";
import { leaveTeam } from "@/lib/teams/actions";
import { createClient } from "@/lib/supabase/server";
import CopyLink from "./CopyLink";
import InviteToggle from "./InviteToggle";
import styles from "../teams.module.css";

export const metadata = { title: "Team" };

const UUID = /^[0-9a-f-]{36}$/i;

export default function TeamPage({ params }) {
  return (
    <main className={styles.page}>
      <Link href="/teams" className={styles.backLink}>
        All teams
      </Link>
      <Suspense fallback={<TeamSkeleton />}>
        <TeamContent params={params} />
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

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// Reads the session, the address and the database, so it streams in.
async function TeamContent({ params }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { profile } = await getProfile();
  const supabase = await createClient();

  const [teamResult, membersResult, sessionsResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, owner_id, invite_code, invite_enabled")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("role, profile_id, profiles(nickname)")
      .eq("team_id", id),
    supabase
      .from("sessions")
      .select(
        "id, played_at, games(name), session_participants(place, profile_id, profiles(nickname), guests(name))",
      )
      .eq("team_id", id)
      .order("played_at", { ascending: false })
      .limit(500),
  ]);

  const team = teamResult.data;
  if (!team) notFound();

  const isOwner = team.owner_id === profile?.id;
  const members = (membersResult.data ?? []).map((row) => ({
    id: row.profile_id,
    name: row.profiles?.nickname ?? "Player",
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
  const recent = sessions.slice(0, 5);

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const link = `${protocol}://${host}/join/${team.invite_code}`;

  return (
    <div className={`${styles.body} stagger`}>
      <h1 className={styles.title}>{team.name}</h1>

      <section className={styles.card} aria-label="Members">
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Members</span>
          <Chip size="s">{members.length}</Chip>
        </div>
        <ul className={styles.members} style={{ marginTop: 10 }}>
          {members.map((member, index) => (
            <li key={member.id} className={styles.member}>
              <Avatar name={member.name} size={32} color={playerColor(index)} />
              {member.name}
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
          <Chip size="s" tone={team.invite_enabled ? "turquoise" : "default"}>
            {team.invite_enabled ? "Link is on" : "Link is off"}
          </Chip>
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
          {isOwner && (
            <InviteToggle teamId={team.id} enabled={team.invite_enabled} />
          )}
        </div>
      </section>

      <section className={styles.card} aria-label="Leaderboard">
        <div className={styles.cardTitle}>Leaderboard</div>
        <ol className={styles.board}>
          {board.map((row, index) => (
            <li key={row.id} className={styles.boardRow}>
              <span
                className={styles.rank}
                style={{ color: index === 0 && row.wins > 0 ? "var(--color-pink-deep)" : undefined }}
              >
                {index + 1}
              </span>
              <Avatar name={row.name} size={36} color={playerColor(index)} />
              <span className={styles.boardName}>{row.name}</span>
              <span className={styles.boardChips}>
                <Chip size="s">
                  {row.games} {row.games === 1 ? "game" : "games"}
                </Chip>
                <Chip size="s" tone="pink">
                  {row.wins} {row.wins === 1 ? "win" : "wins"}
                </Chip>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {recent.length > 0 && (
        <section className={styles.card} aria-label="Team history">
          <div className={styles.cardTitle}>Team history</div>
          <ul className={styles.sessions}>
            {recent.map((session) => {
              const names = session.session_participants
                .map((p) => p.profiles?.nickname ?? p.guests?.name)
                .filter(Boolean);
              const winner = session.session_participants.find(
                (p) => p.place === 1,
              );
              return (
                <li key={session.id} className={styles.sessionRow}>
                  <span className={styles.tile} aria-hidden="true">
                    {(session.games?.name ?? "G").charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.sessionText}>
                    <span className={styles.sessionName}>
                      {session.games?.name ?? "Game"}
                    </span>
                    <span className={styles.chips}>
                      <Chip size="s">
                        {dateFormat.format(new Date(session.played_at))}
                      </Chip>
                      {names.slice(0, 3).map((name) => (
                        <Chip key={name} size="s">
                          {name}
                        </Chip>
                      ))}
                    </span>
                  </span>
                  {winner && (
                    <Chip tone="pink">
                      {winner.profiles?.nickname ?? winner.guests?.name} won
                    </Chip>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={styles.leave}>
        <ConfirmButton
          title="Leave this team?"
          message={`You will stop seeing ${team.name} and its sessions. You can rejoin with an invite link.`}
          confirmLabel="Leave team"
          triggerLabel="Leave team"
          action={leaveTeam.bind(null, team.id)}
        />
      </div>
    </div>
  );
}
