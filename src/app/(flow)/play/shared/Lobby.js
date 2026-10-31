"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Avatar from "@/components/Avatar/Avatar";
import UserText from "@/components/UserText/UserText";
import { clock, roomAction, useNow, useRoom } from "@/lib/games/online/client";
import { INVITE_MS } from "@/lib/games/online/room";
import { playerColor } from "@/lib/sessions/colors";
import TopBar from "./TopBar";
import ui from "./play.module.css";

const STATUS = { joined: "Joined", declined: "Declined", left: "Left" };

// The room before the game (FR-45). Everyone sees who joined and how long
// open invites last. The invited player accepts or declines here; the host
// starts once a friend has joined, or cancels.
export default function Lobby({ title, me, initialRoom, initialPlayers }) {
  const router = useRouter();
  const { room, players, reload, applyRoom } = useRoom(initialRoom, initialPlayers);
  const now = useNow();
  const [error, setError] = useState(null);
  const [busy, startBusy] = useTransition();

  const isHost = room.host_id === me;
  const mine = players.find((row) => row.profile_id === me);
  const joined = players.filter((row) => row.status === "joined");
  const hostName = players.find((row) => row.profile_id === room.host_id)?.nickname;
  const left = (row) => new Date(row.invited_at).getTime() + INVITE_MS - now;

  function act(action, after) {
    setError(null);
    startBusy(async () => {
      const result = await roomAction(room.id, { action });
      if (result.error) {
        setError(result.error);
        await reload();
        return;
      }
      applyRoom(result.room);
      await reload();
      after?.();
    });
  }

  if (room.status !== "waiting") {
    return (
      <Ended title={title}>
        {room.status === "cancelled"
          ? "This game was cancelled."
          : room.status === "playing"
            ? "The game has started. Online play opens in the next update."
            : "This game is over."}
      </Ended>
    );
  }

  // Sorted: host, then joined, then the rest.
  const rank = (row) => (row.profile_id === room.host_id ? 0 : row.status === "joined" ? 1 : row.status === "invited" ? 2 : 3);
  const list = [...players].sort((a, b) => rank(a) - rank(b));

  return (
    <main className={ui.page}>
      <div className={ui.column}>
        <TopBar title={title} backHref="/games/play" />
        <h1 className={ui.headline}>
          {mine?.status === "invited" ? (
            <>
              You&apos;re
              <br />
              invited
            </>
          ) : (
            <>
              Waiting for
              <br />
              friends
            </>
          )}
        </h1>

        <ul className={ui.roster}>
          {list.map((row, index) => {
            const expired = row.status === "invited" && left(row) <= 0;
            return (
              <li key={row.profile_id} className={`${ui.rosterItem} ${row.status === "joined" ? "" : ui.rosterOff}`}>
                <Avatar name={row.nickname} size={40} color={playerColor(index)} registered character={row.character} />
                <span className={ui.rosterName}>
                  {row.profile_id === me ? "You" : <UserText>{row.nickname}</UserText>}
                </span>
                <span className={ui.rosterStatus}>
                  {row.profile_id === room.host_id
                    ? "Host"
                    : row.status === "invited"
                      ? expired
                        ? "Expired"
                        : `Invited · ${clock(left(row))}`
                      : STATUS[row.status]}
                </span>
              </li>
            );
          })}
        </ul>

        {error && (
          <p role="alert" className={ui.problem}>
            {error}
          </p>
        )}

        {mine?.status === "invited" &&
          (left(mine) > 0 ? (
            <>
              <p className={ui.note}>
                <UserText>{hostName}</UserText> invited you to play. This invite ends in {clock(left(mine))}.
              </p>
              <button type="button" className={`${ui.primary} ${ui.big}`} disabled={busy} onClick={() => act("accept")}>
                Join the game
              </button>
              <button type="button" className={ui.ghost} disabled={busy} onClick={() => act("decline", () => router.push("/games/play"))}>
                Decline
              </button>
            </>
          ) : (
            <p className={ui.note}>This invite has expired.</p>
          ))}

        {isHost && (
          <>
            <button
              type="button"
              className={`${ui.primary} ${ui.big}`}
              disabled={busy || joined.length < 2}
              onClick={() => act("start")}
            >
              {joined.length < 2 ? "Waiting for a friend to join" : `Start with ${joined.length} players`}
            </button>
            <button type="button" className={ui.ghost} disabled={busy} onClick={() => act("cancel")}>
              Cancel the game
            </button>
            <p className={ui.note}>Invites last 15 minutes. Friends who have not joined when you start stay out.</p>
          </>
        )}

        {!isHost && mine?.status === "joined" && (
          <p className={ui.note}>
            You&apos;re in. <UserText>{hostName}</UserText> starts the game.
          </p>
        )}
      </div>
    </main>
  );
}

function Ended({ title, children }) {
  return (
    <main className={ui.page}>
      <div className={ui.column}>
        <TopBar title={title} backHref="/games/play" />
        <p className={ui.note}>{children}</p>
        <Link href="/games/play" className={`${ui.primary} ${ui.big}`}>
          Back to games
        </Link>
      </div>
    </main>
  );
}
