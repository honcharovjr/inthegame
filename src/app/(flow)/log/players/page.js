import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Character from "@/components/Character/Character";
import Chip from "@/components/Chip/Chip";
import FlowShell from "@/components/FlowShell/FlowShell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AddGuestForm from "./AddGuestForm";
import styles from "../flow.module.css";

export const metadata = { title: "Who played?" };

const COLORS = ["#120a1a", "#ff4fa3", "#2fd6d6", "#ffffff", "#fff6c2"];
const UUID = /^[0-9a-f-]{36}$/i;

export default function LogPlayersPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <Players searchParams={searchParams} />
    </Suspense>
  );
}

function parseIds(value) {
  return String(value ?? "")
    .split(",")
    .filter((id) => UUID.test(id));
}

function hrefWith(gameId, ids) {
  return `/log/players?game=${gameId}${ids.length ? `&with=${ids.join(",")}` : ""}`;
}

// Reads the URL query and the database, so it streams in behind Suspense.
async function Players({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const gameId = String(params.game ?? "");
  if (!UUID.test(gameId)) {
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
    .order("created_at");

  // Only guests that belong to this player can be selected.
  const known = new Set((guests ?? []).map((guest) => guest.id));
  const selected = parseIds(params.with).filter((id) => known.has(id));
  const selectedGuests = (guests ?? []).filter((guest) =>
    selected.includes(guest.id),
  );
  const count = 1 + selected.length;
  const canContinue = count >= 2;

  return (
    <FlowShell
      step={2}
      tone="yellow"
      backHref="/log"
      headline={"Who\nplayed?"}
    >
      <div className={styles.chips}>
        <Chip tone="white">{game.name}</Chip>
        <Chip tone="white">
          {count} {count === 1 ? "player" : "players"}
        </Chip>
      </div>

      <div className={styles.strip}>
        <div className={styles.stripItem}>
          <Character size={62} color={COLORS[0]} />
          {profile.nickname}
        </div>
        {selectedGuests.map((guest, index) => (
          <div key={guest.id} className={styles.stripItem}>
            <Character size={62} color={COLORS[(index + 1) % COLORS.length]} />
            {guest.name}
          </div>
        ))}
      </div>

      <ul className={styles.list}>
        <li className={styles.row}>
          <span className={styles.rowText}>
            <span className={styles.rowName}>{profile.nickname}</span>
          </span>
          <Chip size="s">You</Chip>
          <span className={`${styles.check} ${styles.checkOn}`} aria-hidden="true">
            &#10003;
          </span>
        </li>
        {(guests ?? []).map((guest) => {
          const on = selected.includes(guest.id);
          const next = on
            ? selected.filter((id) => id !== guest.id)
            : [...selected, guest.id];
          return (
            <li key={guest.id}>
              <Link
                href={hrefWith(gameId, next)}
                className={styles.row}
                aria-pressed={on}
              >
                <span className={styles.rowText}>
                  <span className={styles.rowName}>{guest.name}</span>
                </span>
                <Chip size="s" tone="pink">
                  Guest
                </Chip>
                <span
                  className={`${styles.check} ${on ? styles.checkOn : ""}`}
                  aria-hidden="true"
                >
                  {on ? "✓" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <AddGuestForm gameId={gameId} selectedIds={selected} />

      {canContinue ? (
        <Link
          href={`/log/result?game=${gameId}&with=${selected.join(",")}`}
          className={styles.cta}
        >
          Continue
        </Link>
      ) : (
        <span className={styles.cta} aria-disabled="true">
          Add at least one more player
        </span>
      )}
    </FlowShell>
  );
}
