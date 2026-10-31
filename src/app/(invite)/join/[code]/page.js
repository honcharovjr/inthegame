import BackButton from "@/components/BackButton/BackButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MetaLine from "@/components/MetaLine/MetaLine";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import JoinButton from "./JoinButton";
import styles from "@/app/app/(main)/teams/teams.module.css";

export const metadata = { title: "join a team" };

export default function JoinPage({ params }) {
  return (
    <main className={styles.page}>
      <BackButton fallback="/app/teams" />
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
        <Link href="/app/teams" className={styles.backLink}>
          Go to my teams
        </Link>
      </section>
    );
  }

  if (team.already_member) {
    redirect(`/app/teams/${team.id}`);
  }

  return (
    <section className={`${styles.card} stagger`} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span className={styles.cardTitle}>You are invited to</span>
      <h1 className={`${styles.title} keep-case`}>{team.name}</h1>
      <MetaLine items={[`${team.member_count} ${Number(team.member_count) === 1 ? "member" : "members"}`]} />
      <JoinButton code={code} />
    </section>
  );
}
