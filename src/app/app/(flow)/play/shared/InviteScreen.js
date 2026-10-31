"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Avatar from "@/components/Avatar/Avatar";
import UserText from "@/components/UserText/UserText";
import { createRoom } from "@/lib/games/online/client";
import { playerColor } from "@/lib/sessions/colors";
import TopBar from "./TopBar";
import ui from "./play.module.css";

// Invite friends to play from their own devices (FR-45). Only teammates can
// be invited, so the screen picks a team first. Sending opens the lobby.
export default function InviteScreen({ title, gameKey, teams, maxPlayers, onBack }) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? null);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState(null);
  const [sending, startSending] = useTransition();

  const members = teams.find((item) => item.id === teamId)?.members ?? [];

  function chooseTeam(id) {
    setTeamId(id);
    setPicked([]);
  }

  function toggle(id) {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length + 1 < maxPlayers
          ? [...current, id]
          : current,
    );
  }

  function send() {
    setError(null);
    startSending(async () => {
      const result = await createRoom(gameKey, picked);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/app/play/${gameKey}/room/${result.id}`);
    });
  }

  return (
    <main className={ui.page}>
      <div className={ui.column}>
        <TopBar title={title} onBack={onBack} />
        <h1 className={ui.headline}>
          Who do you
          <br />
          invite?
        </h1>

        {teams.length === 0 ? (
          <p className={ui.note}>Join or create a team first. You can invite your teammates.</p>
        ) : (
          <>
            {teams.length > 1 && (
              <div className={ui.chips} role="group" aria-label="Team">
                {teams.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${ui.chip} ${teamId === item.id ? ui.chipOn : ""}`}
                    aria-pressed={teamId === item.id}
                    onClick={() => chooseTeam(item.id)}
                  >
                    <UserText>{item.name}</UserText>
                  </button>
                ))}
              </div>
            )}

            {members.length === 0 ? (
              <p className={ui.note}>Nobody else is in this team yet.</p>
            ) : (
              <div className={ui.pool}>
                {members.map((member) => {
                  const order = picked.indexOf(member.id);
                  const on = order !== -1;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`${ui.poolItem} ${on ? ui.poolOn : ""}`}
                      aria-pressed={on}
                      onClick={() => toggle(member.id)}
                    >
                      <Avatar name={member.nickname} size={34} color={on ? playerColor(order + 1) : "#5b4a63"} registered character={member.character} />
                      <span className={`${ui.poolName} keep-case`}>{member.nickname}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <p role="alert" className={ui.problem}>
                {error}
              </p>
            )}

            <button type="button" className={`${ui.primary} ${ui.big}`} disabled={picked.length === 0 || sending} onClick={send}>
              {picked.length === 0
                ? "Pick at least 1 friend"
                : sending
                  ? "Sending…"
                  : `Invite ${picked.length} ${picked.length === 1 ? "friend" : "friends"}`}
            </button>
            <p className={ui.note}>Invites last 15 minutes. You start the game once a friend joins.</p>
          </>
        )}
      </div>
    </main>
  );
}
