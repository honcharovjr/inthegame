import { redirect } from "next/navigation";
import { Suspense } from "react";
import Chip from "@/components/Chip/Chip";
import FlowShell from "@/components/FlowShell/FlowShell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import ResultForm from "./ResultForm";
import styles from "../flow.module.css";

export const metadata = { title: "Who won?" };

const COLORS = ["#120a1a", "#ffffff", "#2fd6d6", "#ffe14d", "#fff6c2"];
const UUID = /^[0-9a-f-]{36}$/i;

export default function LogResultPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}

// Reads the URL query and the database, so it streams in behind Suspense.
async function Result({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const gameId = String(params.game ?? "");
  const withIds = String(params.with ?? "")
    .split(",")
    .filter((id) => UUID.test(id));
  if (!UUID.test(gameId) || withIds.length < 1) {
    redirect("/log");
  }

  const supabase = await createClient();
  const [{ data: game }, { data: profile }] = await Promise.all([
    supabase.from("games").select("id, name").eq("id", gameId).maybeSingle(),
    supabase
      .from("profiles")
      .select("id, nickname")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (!game || !profile) {
    redirect("/log");
  }

  const { data: guests } = await supabase
    .from("guests")
    .select("id, name")
    .eq("owner_id", profile.id)
    .in("id", withIds);
  const chosen = withIds
    .map((id) => (guests ?? []).find((guest) => guest.id === id))
    .filter(Boolean);
  if (chosen.length < 1) {
    redirect(`/log/players?game=${gameId}`);
  }

  const participants = [
    { key: "me", name: profile.nickname, color: COLORS[0] },
    ...chosen.map((guest, index) => ({
      key: guest.id,
      name: guest.name,
      color: COLORS[(index + 1) % COLORS.length],
    })),
  ];

  return (
    <FlowShell
      step={3}
      tone="pink"
      backHref={`/log/players?game=${gameId}&with=${withIds.join(",")}`}
      headline={"Who\nwon?"}
    >
      <div className={styles.chips}>
        <Chip tone="white">{game.name}</Chip>
        <Chip tone="white">{participants.length} players</Chip>
      </div>
      <ResultForm gameId={gameId} participants={participants} />
    </FlowShell>
  );
}
