import { Suspense } from "react";
import BackButton from "@/components/BackButton/BackButton";
import Chip from "@/components/Chip/Chip";
import Skeleton from "@/components/Skeleton/Skeleton";
import { checkPlayer } from "@/lib/achievements/award";
import { ACHIEVEMENTS, GROUPS } from "@/lib/achievements/catalog";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import styles from "./achievements.module.css";

export const metadata = { title: "achievements" };

export default function AchievementsPage() {
  return (
    <main className={styles.page}>
      <BackButton fallback="/profile" />
      <h1 className={styles.title}>Achievements</h1>
      <Suspense fallback={<AchievementsSkeleton />}>
        <AchievementsContent />
      </Suspense>
    </main>
  );
}

function AchievementsSkeleton() {
  return (
    <div className={styles.body}>
      <Skeleton width={120} height={28} radius={14} />
      <Skeleton height={200} radius={22} delay={80} />
      <Skeleton height={200} radius={22} delay={160} />
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Checks the history first, so earlier play counts the moment this opens.
async function AchievementsContent() {
  const { profile } = await getProfile();
  const { results } = await checkPlayer(profile.id);

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_achievements")
    .select("earned_at, achievements(code)")
    .eq("profile_id", profile.id);
  const earnedAt = new Map(
    (data ?? []).map((row) => [row.achievements?.code, row.earned_at]),
  );
  const progress = new Map(results.map((row) => [row.code, row]));
  const total = results.filter((row) => row.earned).length;

  return (
    <div className={`${styles.body} stagger`}>
      <div className={styles.chips}>
        <Chip tone="yellow">
          {total} of {ACHIEVEMENTS.length} earned
        </Chip>
      </div>

      {GROUPS.map((group) => (
        <section key={group.id} className={styles.card} aria-label={group.label}>
          <div className={styles.cardTitle}>{group.label}</div>
          <ul className={styles.list}>
            {ACHIEVEMENTS.filter((item) => item.group === group.id).map((item) => {
              const state = progress.get(item.code);
              const done = Boolean(state?.earned);
              return (
                <li key={item.code} className={`${styles.row} ${done ? "" : styles.locked}`}>
                  <span className={`${styles.medal} ${styles[`tier${item.tier}`]}`} aria-hidden="true">
                    {done ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    ) : (
                      item.tier
                    )}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.description}>{item.description}</span>
                    {!done && state && state.target > 1 && (
                      <span className={styles.progress}>
                        <span
                          className={styles.bar}
                          style={{ width: `${Math.round((state.current / state.target) * 100)}%` }}
                        />
                      </span>
                    )}
                  </span>
                  {done ? (
                    <Chip size="s" tone="turquoise">
                      {earnedAt.has(item.code)
                        ? dateFormat.format(new Date(earnedAt.get(item.code)))
                        : "Earned"}
                    </Chip>
                  ) : (
                    state &&
                    state.target > 1 && (
                      <Chip size="s">
                        {state.current} of {state.target}
                      </Chip>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
