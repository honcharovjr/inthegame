"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserText from "@/components/UserText/UserText";
import { clock, roomAction, useNow } from "@/lib/games/online/client";
import { GRACE_MS } from "@/lib/games/online/room";
import { currentPlayer, hasRolled } from "@/lib/games/yahtzee/rules";
import { playerColor } from "@/lib/sessions/colors";
import { Ended } from "../shared/Lobby";
import ui from "../shared/play.module.css";
import YahtzeeBoard from "./YahtzeeBoard";
import YahtzeeResults from "./YahtzeeResults";
import styles from "./yahtzee.module.css";

// How often a device asks again when the server did not see a deadline pass
// yet, for example because the clocks differ a little, and how many times.
const TICK_RETRY_MS = 1000;
const TICK_TRIES = 10;

// Online Yahtzee (FR-45). Every device shows the same game from the server;
// only the player on turn can roll, hold and score. Timers run on the
// server: when a deadline passes on this device it asks the server to apply
// it. offset is the server clock minus this device's clock.
export default function OnlineYahtzee({ me, roomState, offset }) {
  const { room, players, reload, applyRoom } = roomState;
  const { state } = room;
  const game = state.game;
  const now = useNow(500) + offset;
  const [selected, setSelected] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);

  // Only the dice of a new roll tumble. Compared with the last game seen.
  const [seen, setSeen] = useState({ version: room.version, game, moved: [], rollId: 0 });
  if (seen.version !== room.version) {
    const before = seen.game;
    const rolled = game.turn === before.turn && game.rollsLeft < before.rollsLeft;
    setSeen({
      version: room.version,
      game,
      moved: rolled ? (hasRolled(before) ? before.held.map((held) => !held) : game.dice.map(() => true)) : seen.moved,
      rollId: rolled ? seen.rollId + 1 : seen.rollId,
    });
    if (game.turn !== before.turn) setSelected(null);
    setTries(0);
  }

  const endsAt = state.timer.endsAt;
  const ended = Boolean(state.end);
  useEffect(() => {
    if (ended || endsAt === null || tries >= TICK_TRIES) return;
    const wait = Math.max(0, endsAt - (Date.now() + offset)) + TICK_RETRY_MS;
    const id = setTimeout(async () => {
      const result = await roomAction(room.id, { action: "tick" });
      if (result.room && result.room.version > room.version) applyRoom(result.room);
      else setTries((count) => count + 1);
    }, wait);
    return () => clearTimeout(id);
  }, [ended, endsAt, tries, offset, room.id, room.version, applyRoom]);

  async function send(body) {
    setBusy(true);
    setError(null);
    const result = await roomAction(room.id, { version: room.version, ...body });
    setBusy(false);
    if (result.room) {
      applyRoom(result.room);
      return;
    }
    setError(result.error);
    if (result.status === 409) await reload();
  }

  const people = game.players.map((key, index) => {
    const row = players.find((item) => item.profile_id === key);
    return {
      key,
      name: row?.nickname ?? "Player",
      color: playerColor(row?.seat ?? index),
      registered: true,
      character: row?.character ?? null,
    };
  });
  const back = (
    <Link href="/games/play" className={`${ui.primary} ${ui.big}`}>
      Back to games
    </Link>
  );

  if (state.end?.status === "finished") {
    return (
      <main className={ui.page}>
        <YahtzeeResults game={game} participants={people} meKey={me}>
          {back}
        </YahtzeeResults>
      </main>
    );
  }
  if (state.end) {
    return (
      <Ended title="Yahtzee">
        {state.end.reason === "dismissed"
          ? "The host ran out of time, so the game was dismissed. Nobody wins and nothing was recorded."
          : "Everyone else left, so the game ended. Nobody wins and nothing was recorded."}
      </Ended>
    );
  }
  if (!game.players.includes(me)) {
    return <Ended title="Yahtzee">The host removed you from this game after your turn ran out.</Ended>;
  }

  const active = currentPlayer(game);
  const isHost = me === state.host;
  const name = (key) =>
    key === me ? "You" : <UserText>{people.find((item) => item.key === key)?.name}</UserText>;
  const left = endsAt === null ? null : endsAt - now;
  const { phase } = state.timer;

  let banner;
  if (phase === "turn") {
    banner = (
      <p className={`${styles.clock} ${left < 10_000 ? styles.clockLow : ""}`} aria-live="off">
        {clock(left)} left
      </p>
    );
  } else {
    const hostLate = active === state.host;
    const message =
      phase === "paused"
        ? active === me
          ? "The host is waiting for you. Play your turn."
          : <>Waiting for {name(active)}.</>
        : phase === "grace" && !hostLate
          ? <>{name(active)} {active === me ? "are" : "is"} out of time. The turn is skipped in {clock(left)}.</>
          : <>{name(active)} {active === me ? "are" : "is"} out of time. The game ends in {clock(phase === "grace" ? left + GRACE_MS : left)}.</>;

    banner = (
      <div className={styles.late} role="status">
        <p>{message}</p>
        {isHost && !hostLate && (
          <div className={styles.lateActions}>
            {phase === "grace" ? (
              <button type="button" className={ui.ghost} disabled={busy} onClick={() => send({ action: "wait" })}>
                Wait for {name(active)}
              </button>
            ) : (
              <button type="button" className={ui.ghost} disabled={busy} onClick={() => send({ action: "resume" })}>
                Resume the game
              </button>
            )}
            <button type="button" className={ui.ghost} disabled={busy} onClick={() => send({ action: "remove" })}>
              Remove {name(active)}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className={ui.page}>
      <YahtzeeBoard
        game={game}
        participants={people}
        meKey={me}
        canAct={active === me && !busy}
        selected={selected}
        onSelect={setSelected}
        viewing={viewing}
        onView={setViewing}
        moved={seen.moved}
        rollId={seen.rollId}
        onRoll={() => send({ action: "move", move: { type: "roll" } })}
        onHold={(index) => send({ action: "move", move: { type: "hold", index } })}
        onScore={() => {
          send({ action: "move", move: { type: "score", category: selected } });
          setSelected(null);
        }}
        banner={
          <>
            {banner}
            {error && (
              <p role="alert" className={ui.problem}>
                {error}
              </p>
            )}
          </>
        }
      />
    </main>
  );
}
