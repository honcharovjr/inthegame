import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import Skeleton from "@/components/Skeleton/Skeleton";
import { signOut } from "@/lib/auth/actions";
import { getProfile } from "@/lib/auth/session";
import styles from "./page.module.css";

export default function Home({ searchParams }) {
  return (
    <main className={styles.main}>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

function HomeSkeleton() {
  return (
    <>
      <div className={styles.header}>
        <Skeleton width={150} height={14} />
        <Skeleton width={220} height={36} delay={80} style={{ marginTop: 8 }} />
      </div>
      <div className={styles.card}>
        <Skeleton width={96} height={96} radius={48} delay={160} />
        <div className={styles.identity}>
          <Skeleton width={140} height={30} delay={240} />
          <Skeleton width={170} height={28} radius={14} delay={320} />
        </div>
      </div>
      <Skeleton height={58} radius={29} delay={400} />
    </>
  );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function HomeContent({ searchParams }) {
  const { saved } = await searchParams;
  const { profile, error } = await getProfile();

  return (
    <div className={`${styles.content} stagger`}>
      <header className={styles.header}>
        <div className={styles.date}>{dateFormat.format(new Date())}</div>
        <h1 className={styles.title}>Hey, {profile?.nickname ?? "player"}</h1>
      </header>

      {error && (
        <p role="alert" className={styles.problem}>
          Could not load your profile: {error.message}
        </p>
      )}

      <section className={styles.card} aria-label="Your character">
        <div className={styles.stage}>
          <div className={styles.stageShape} aria-hidden="true" />
          <Avatar name={profile?.nickname} size={84} color="#ff4fa3" />
        </div>
        <div className={styles.identity}>
          <div className={styles.name}>{profile?.nickname}</div>
          {profile?.created_at && (
            <Chip>
              Playing since {monthFormat.format(new Date(profile.created_at))}
            </Chip>
          )}
        </div>
      </section>

      {saved && (
        <p role="status" className={styles.saved}>
          Session saved. Nice game.
        </p>
      )}

      <Link href="/log" className={styles.logButton}>
        <span>Log a session</span>
        <span className={styles.logPlus} aria-hidden="true">
          +
        </span>
      </Link>

      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Log out
        </button>
      </form>
    </div>
  );
}
