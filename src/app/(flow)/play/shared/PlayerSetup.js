"use client";

import { useState, useTransition } from "react";
import Avatar from "@/components/Avatar/Avatar";
import UserText from "@/components/UserText/UserText";
import { PlusIcon } from "@/components/icons";
import { playerColor } from "@/lib/sessions/colors";
import { createGuest } from "@/lib/sessions/actions";
import TopBar from "./TopBar";
import ui from "./play.module.css";

// Who plays: you first, then teammates of one team and your guests. The
// state lives in the game, so going back to the modes keeps the picks.
export function usePlayerSetup({ profile, initialGuests, teams, maxPlayers }) {
  const [guests, setGuests] = useState(initialGuests);
  const [teamId, setTeamId] = useState(null);
  const [picked, setPicked] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState(null);
  const [addingGuest, startAddingGuest] = useTransition();

  const team = teams.find((item) => item.id === teamId) ?? null;
  const me = {
    key: "me",
    name: profile.nickname,
    registered: true,
    character: profile.character,
  };
  const pool = [
    me,
    ...(team?.members ?? []).map((member) => ({
      key: `p:${member.id}`,
      name: member.nickname,
      registered: true,
      character: member.character,
      tag: "Teammate",
    })),
    ...guests.map((guest) => ({ key: guest.id, name: guest.name, tag: "Guest" })),
  ];
  const lineup = ["me", ...picked]
    .map((key) => pool.find((person) => person.key === key))
    .filter(Boolean)
    .map((person, index) => ({ ...person, color: playerColor(index) }));

  function togglePick(key) {
    setPicked((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : current.length + 1 < maxPlayers
          ? [...current, key]
          : current,
    );
  }

  function chooseTeam(id) {
    setTeamId(id);
    // Teammates of another team leave the lineup, guests stay.
    setPicked((current) => current.filter((key) => !key.startsWith("p:")));
  }

  function submitGuest(event) {
    event.preventDefault();
    setGuestError(null);
    startAddingGuest(async () => {
      const result = await createGuest(guestName);
      if (result.error) {
        setGuestError(result.error);
        return;
      }
      setGuests((current) => [...current, result.guest]);
      setPicked((current) =>
        current.length + 1 < maxPlayers ? [...current, result.guest.id] : current,
      );
      setGuestName("");
    });
  }

  return {
    me: { ...me, color: playerColor(0) },
    pool,
    lineup,
    teams,
    teamId,
    setTeamId,
    picked,
    togglePick,
    chooseTeam,
    guestName,
    setGuestName,
    guestError,
    addingGuest,
    submitGuest,
    maxPlayers,
  };
}

// The screen for picking players, in turn order.
export function SetupScreen({ title, setup, onBack, onStart }) {
  const { lineup, teams, teamId, pool, picked, maxPlayers } = setup;
  const enough = lineup.length >= 2;

  return (
    <main className={ui.page}>
      <div className={ui.column}>
        <TopBar title={title} onBack={onBack} />
        <h1 className={ui.headline}>
          Who&apos;s
          <br />
          playing?
        </h1>

        <div className={ui.lineup} aria-label="Players in order">
          {lineup.map((item, index) => (
            <div key={item.key} className={ui.lineupItem}>
              <span className={ui.order}>{index + 1}</span>
              <Avatar name={item.name} size={52} color={item.color} registered={item.registered} character={item.character} />
              <span className={ui.lineupName}>
                {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
              </span>
            </div>
          ))}
        </div>

        {teams.length > 0 && (
          <div className={ui.chips} role="group" aria-label="Team">
            <button
              type="button"
              className={`${ui.chip} ${!teamId ? ui.chipOn : ""}`}
              aria-pressed={!teamId}
              onClick={() => setup.chooseTeam(null)}
            >
              No team
            </button>
            {teams.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${ui.chip} ${teamId === item.id ? ui.chipOn : ""}`}
                aria-pressed={teamId === item.id}
                onClick={() => setup.chooseTeam(item.id)}
              >
                <UserText>{item.name}</UserText>
              </button>
            ))}
          </div>
        )}

        <div className={ui.pool}>
          {pool
            .filter((item) => item.key !== "me")
            .map((item) => {
              const on = picked.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${ui.poolItem} ${on ? ui.poolOn : ""}`}
                  aria-pressed={on}
                  onClick={() => setup.togglePick(item.key)}
                >
                  <Avatar name={item.name} size={34} color={on ? lineup.find((p) => p.key === item.key)?.color : "#5b4a63"} registered={item.registered} character={item.character} />
                  <span className={`${ui.poolName} keep-case`}>{item.name}</span>
                  <span className={ui.poolTag}>{item.tag}</span>
                </button>
              );
            })}
        </div>

        <form onSubmit={setup.submitGuest} className={ui.guestForm}>
          <input
            className={ui.guestInput}
            value={setup.guestName}
            onChange={(event) => setup.setGuestName(event.target.value)}
            type="text"
            maxLength={30}
            placeholder="Add a guest by name"
            aria-label="Guest name"
            required
          />
          <button
            type="submit"
            className={ui.guestAdd}
            aria-label="Add guest"
            data-tip="Add guest"
            data-tip-align="end"
            disabled={setup.addingGuest}
          >
            <PlusIcon size={22} />
          </button>
        </form>
        {setup.guestError && (
          <p role="alert" className={ui.problem}>
            {setup.guestError}
          </p>
        )}

        <button type="button" className={`${ui.primary} ${ui.big}`} disabled={!enough} onClick={onStart}>
          {enough ? `Start with ${lineup.length} players` : "Add at least 1 more player"}
        </button>
        <p className={ui.note}>Up to {maxPlayers} players. The order above is the turn order.</p>
      </div>
    </main>
  );
}
