"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Avatar from "@/components/Avatar/Avatar";
import UserText from "@/components/UserText/UserText";
import { clock, roomAction, useMyRooms, useNow } from "@/lib/games/online/client";
import { INVITE_MS } from "@/lib/games/online/room";
import { findPlayable } from "@/lib/games/playable";
import styles from "./GameInvites.module.css";

// Invites to online games and the games the player is in (FR-45), on Home
// and in Play. New invites appear without a reload; an expired invite
// disappears when its countdown ends. Shows nothing when there is nothing.
export default function GameInvites({ profileId }) {
  const router = useRouter();
  const items = useMyRooms(profileId);
  const now = useNow();
  const [error, setError] = useState(null);
  const [busy, startBusy] = useTransition();

  const href = (item) => `/play/${item.gameKey}/room/${item.roomId}`;
  const left = (item) => new Date(item.invitedAt).getTime() + INVITE_MS - now;
  const visible = (items ?? []).filter((item) => item.status === "joined" || left(item) > 0);
  if (visible.length === 0) return null;

  function act(item, action) {
    setError(null);
    startBusy(async () => {
      const result = await roomAction(item.roomId, { action });
      if (result.error) setError(result.error);
      else if (action === "accept") router.push(href(item));
    });
  }

  return (
    <section className={styles.list} aria-label="Game invites">
      {visible.map((item) => {
        const game = findPlayable(item.gameKey)?.name ?? "A game";
        return (
          <div key={item.roomId} className={styles.card}>
            <Avatar name={item.host.nickname} size={44} registered character={item.host.character} />
            <div className={styles.text}>
              {item.status === "invited" ? (
                <>
                  <strong>
                    <UserText>{item.host.nickname}</UserText> invites you to {game}
                  </strong>
                  <span className={styles.timer}>Ends in {clock(left(item))}</span>
                </>
              ) : (
                <>
                  <strong>
                    {game} with <UserText>{item.host.nickname}</UserText>
                  </strong>
                  <span>{item.roomStatus === "playing" ? "In progress" : "Waiting to start"}</span>
                </>
              )}
            </div>
            <div className={styles.actions}>
              {item.status === "invited" ? (
                <>
                  <button type="button" className={styles.primary} disabled={busy} onClick={() => act(item, "accept")}>
                    Join
                  </button>
                  <button type="button" className={styles.ghost} disabled={busy} onClick={() => act(item, "decline")}>
                    Decline
                  </button>
                </>
              ) : (
                <Link href={href(item)} className={styles.primary}>
                  Open
                </Link>
              )}
            </div>
          </div>
        );
      })}
      {error && (
        <p role="alert" className={styles.problem}>
          {error}
        </p>
      )}
    </section>
  );
}
