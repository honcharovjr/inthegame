import { Suspense } from "react";
import BigStats from "@/components/BigStats/BigStats";
import { AsideTitle } from "@/components/PageFrame/PageFrame";
import Skeleton from "@/components/Skeleton/Skeleton";
import { getProfile } from "@/lib/auth/session";
import { monthStats } from "@/lib/stats/month";
import { loadResults } from "@/lib/stats/results";
import { createClient } from "@/lib/supabase/server";

// Wins, sessions and win rate since the player joined, for the side block of
// Profile and History. Streams in on its own.
export default function AllTimeStats({ children }) {
  return (
    <>
      <AsideTitle>All time</AsideTitle>
      <Suspense fallback={<Skeleton height={60} radius={16} />}>
        <Numbers />
      </Suspense>
      {children}
    </>
  );
}

async function Numbers() {
  const { profile } = await getProfile();
  const supabase = await createClient();
  const { rows } = profile ? await loadResults(supabase, profile.id) : { rows: [] };
  const stats = monthStats(rows);

  return (
    <BigStats
      items={[
        { label: stats.wins === 1 ? "win" : "wins", value: stats.wins, tone: "yellow" },
        { label: stats.played === 1 ? "session" : "sessions", value: stats.played, tone: "pink" },
        { label: "win rate", value: stats.winRate === null ? "–" : `${stats.winRate}%`, tone: "turquoise" },
      ]}
    />
  );
}
