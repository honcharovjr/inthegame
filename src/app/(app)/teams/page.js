import Link from "next/link";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import PageFrame, { PageTop } from "@/components/PageFrame/PageFrame";
import Poster from "@/components/Poster/Poster";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import CreateTeamForm from "./CreateTeamForm";
import styles from "./teams.module.css";

export const metadata = { title: "teams" };

export default function TeamsPage() {
  return (
    <PageFrame>
      <PageTop
        label="Start a team"
        poster={<Poster tone="turquoise" kicker="Teams" headline="your table, your people." face={4} />}
        aside={<CreateTeamForm />}
      />
      <Suspense fallback={<TeamsSkeleton />}>
        <TeamList />
      </Suspense>
    </PageFrame>
  );
}

function TeamsSkeleton() {
  return (
    <div className={styles.body}>
      <Skeleton height={96} radius={22} />
      <Skeleton height={96} radius={22} delay={80} />
      <Skeleton height={120} radius={22} delay={160} />
    </div>
  );
}

// Reads the session and the database, so it streams in behind Suspense.
async function TeamList() {
  const { profile } = await getProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("role, teams(id, name, team_members(count))")
    .eq("profile_id", profile?.id);

  const teams = (data ?? [])
    .filter((row) => row.teams)
    .map((row) => ({
      id: row.teams.id,
      name: row.teams.name,
      role: row.role,
      members: row.teams.team_members[0]?.count ?? 1,
    }));

  return (
    <div className={`${styles.body} ${styles.wide} stagger`}>
      {error && (
        <p role="alert" className={styles.error}>
          Could not load your teams: {error.message}
        </p>
      )}

      <ul className={styles.teamGrid}>
        <li>
          <Link href="/teams/personal" className={styles.teamRow}>
            <span className={`${styles.tile} ${styles.personalTile}`} aria-hidden="true">
              ★
            </span>
            <span className={styles.teamText}>
              <span className={styles.teamName}>Personal</span>
              <span className={styles.chips}>
                <Chip size="s">Sessions without a team</Chip>
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              &#8250;
            </span>
          </Link>
        </li>
        {teams.map((team) => (
          <li key={team.id}>
            <Link href={`/teams/${team.id}`} className={styles.teamRow}>
              <span className={`${styles.tile} keep-case`} aria-hidden="true">
                {team.name.charAt(0)}
              </span>
              <span className={styles.teamText}>
                <span className={`${styles.teamName} keep-case`}>{team.name}</span>
                <span className={styles.chips}>
                  <Chip size="s">
                    {team.members} {team.members === 1 ? "member" : "members"}
                  </Chip>
                  {team.role === "owner" && (
                    <Chip size="s" tone="pink">
                      Owner
                    </Chip>
                  )}
                </span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                &#8250;
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!error && teams.length === 0 && (
        <p className={styles.empty}>
          You are not in a team yet. Start one, then send the invite link to
          your friends.
        </p>
      )}
    </div>
  );
}
