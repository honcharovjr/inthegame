import { Suspense } from "react";
import BackButton from "@/components/BackButton/BackButton";
import Skeleton from "@/components/Skeleton/Skeleton";
import { checkPlayer } from "@/lib/achievements/award";
import { getProfile } from "@/lib/auth/session";
import Customizer from "./Customizer";
import styles from "./customize.module.css";

export const metadata = { title: "Your character" };

export default function CustomizePage() {
  return (
    <main className={styles.page}>
      <BackButton fallback="/profile" />
      <h1 className={styles.title}>Your character</h1>
      <Suspense fallback={<Skeleton height={420} radius={22} />}>
        <CustomizeContent />
      </Suspense>
    </main>
  );
}

// Brings the achievements up to date first, so items earned a moment ago are open.
async function CustomizeContent() {
  const { profile } = await getProfile();
  const { results } = await checkPlayer(profile.id);
  const earned = results.filter((row) => row.earned).map((row) => row.code);

  return (
    <Customizer
      name={profile.nickname}
      initial={profile.character}
      earned={earned}
    />
  );
}
