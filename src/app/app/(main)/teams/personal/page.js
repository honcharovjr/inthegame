import Link from "next/link";
import { Suspense } from "react";
import BackButton from "@/components/BackButton/BackButton";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { loadPanelSessions, readPage } from "@/lib/sessions/panel";
import { createClient } from "@/lib/supabase/server";
import SessionHistory from "../SessionHistory";
import styles from "../teams.module.css";

export const metadata = { title: "personal" };

// Sessions logged without a team. They are managed here, like a team's
// sessions on its page, and never move into a team.
export default function PersonalPage({ searchParams }) {
  return (
    <main className={styles.page}>
      <BackButton fallback="/app/teams" />
      <Link href="/app/teams" className={styles.backLink}>
        All teams
      </Link>
      <Suspense
        fallback={
          <div className={styles.body}>
            <Skeleton width={220} height={44} />
            <Skeleton height={240} radius={22} delay={80} />
          </div>
        }
      >
        <Personal searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Personal({ searchParams }) {
  const page = readPage((await searchParams).page);
  const { profile } = await getProfile();
  const supabase = await createClient();
  const history = await loadPanelSessions(supabase, { profileId: profile?.id, page });

  return (
    <div className={`${styles.body} stagger`}>
      <h1 className={styles.title}>Personal</h1>
      <p className={styles.lead}>
        Sessions you logged without a team. Only you see and manage them here.
      </p>
      <SessionHistory
        title="Personal history"
        sessions={history.sessions}
        profileId={profile?.id}
        page={page}
        totalPages={history.totalPages}
        pageHref={(next) => `/app/teams/personal${next > 1 ? `?page=${next}` : ""}`}
        empty="No personal sessions yet. Log a session with no team and it shows up here."
      />
    </div>
  );
}
