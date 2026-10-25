import BackButton from "@/components/BackButton/BackButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import JoinButton from "./JoinButton";
import styles from "../../teams/teams.module.css";

export const metadata = { title: "Join a team" };

export default function JoinPage({ params }) {
  return (
    <main className={styles.page}>
      <BackButton fallback="/teams" />
      <Suspense fallback={<Skeleton height={220} radius={22} />}>
        <Invite params={params} />
      </Suspense>
    </main>
  );
}

// Shows which team the link belongs to and asks before joining.
async function Invite({ params }) {
  const { code } = await params;
  // Someone who is not logged in comes back to this link after logging in.
  await requireUser(`/join/${code}`);

  const supabase = await createClient();
  const { data } = await supabase.rpc("team_by_invite", { p_code: code });
  const team = data?.[0];

  if (!team) {
    return (
      <section className={`${styles.card} stagger`}>
        <h1 className={styles.title}>Invite not valid</h1>
        <p className={styles.empty}>
          This link is switched off or does not exist. Ask your friend for a
          new one.
        </p>
        <Link href="/teams" className={styles.backLink}>
          Go to my teams
        </Link>
      </section>
    );
  }

  if (team.already_member) {
    redirect(`/teams/${team.id}`);
  }

  return (
    <section className={`${styles.card} stagger`} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span className={styles.cardTitle}>You are invited to</span>
      <h1 className={styles.title}>{team.name}</h1>
      <div className={styles.chips}>
        <Chip>
          {team.member_count} {Number(team.member_count) === 1 ? "member" : "members"}
        </Chip>
      </div>
      <JoinButton code={code} />
    </section>
  );
}
