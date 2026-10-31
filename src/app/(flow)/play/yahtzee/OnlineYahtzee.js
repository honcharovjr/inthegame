"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserText from "@/components/UserText/UserText";
import { REACTIONS, clock, createRoom, roomAction, useNow, useRoomLive } from "@/lib/games/online/client";
import { GRACE_MS } from "@/lib/games/online/room";
import { yahtzeeOnline } from "@/lib/games/yahtzee/online";
import { CATEGORIES, YAHTZEE_BONUS, currentPlayer, hasRolled, isYahtzee, totals } from "@/lib/games/yahtzee/rules";
import { playerColor } from "@/lib/sessions/colors";
import { playRoll, playYahtzee, playYourTurn, setSoundOn, useSoundOn } from "../shared/feedback";
import { Ended } from "../shared/Lobby";
import ui from "../shared/play.module.css";
import YahtzeeBoard, { LABELS } from "./YahtzeeBoard";
import YahtzeeResults from "./YahtzeeResults";
import styles from "./yahtzee.module.css";

// How often a device asks again when the server did not see a deadline pass
// yet, for example because the clocks differ a little, and how many times.
const TICK_RETRY_MS = 1000;
const TICK_TRIES = 10;

// Online Yahtzee (FR-45). Every device shows the same game from the server;
// only the player on turn can roll and score. Holds and the points of each
// box stay on this device; the holds go to the server with the next roll,
// which the server makes. Timers run on the server: when a deadline passes
// here, the device asks the server to apply it. offset is the server clock
// minus this device's clock. The host can end the game at any time; the
// others can ask the host to.
export default function OnlineYahtzee({ me, roomState, offset }) {
  const router = useRouter();
  const { room, players, reload, applyRoom } = roomState;
  const { state } = room;
  const game = state.game;
  const now = useNow(500) + offset;
  const live = useRoomLive(room.id, me);
  const soundOn = useSoundOn();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [tries, setTries] = useState(0);
  // The holds picked on this device since the last roll.
  const [held, setHeld] = useState(game.held);

  // A new version from the server: only the dice of a new roll tumble, and
  // a Yahtzee is celebrated on every device.
  const [seen, setSeen] = useState({ version: room.version, game, moved: [], rollId: 0, yahtzee: false });
  if (seen.version !== room.version) {
    const before = seen.game;
    const rolled = game.turn === before.turn && game.rollsLeft < before.rollsLeft;
    setSeen({
      version: room.version,
      game,
      moved: rolled ? (hasRolled(before) ? game.held.map((on) => !on) : game.dice.map(() => true)) : seen.moved,
      rollId: rolled ? seen.rollId + 1 : seen.rollId,
      yahtzee: rolled && isYahtzee(game.dice),
    });
    setHeld(game.held);
    setRolling(false);
    setTries(0);
  }

  useEffect(() => {
    if (seen.rollId === 0) return;
    if (seen.yahtzee) playYahtzee();
    else playRoll();
  }, [seen.rollId, seen.yahtzee]);

  const active = currentPlayer(game);
  const ended = Boolean(state.end);
  useEffect(() => {
    if (!ended && active === me) playYourTurn();
  }, [active, me, ended, game.turn]);

  const endsAt = state.timer.endsAt;
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
      return true;
    }
    setRolling(false);
    setError(result.error);
    if (result.status === 409) await reload();
    return false;
  }

  function roll() {
    // The loose dice start shaking at once and land when the server answers.
    setRolling(true);
    send({ action: "move", move: { type: "roll", held } });
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
  const nameOf = (key) => players.find((item) => item.profile_id === key)?.nickname ?? "Player";
  const name = (key) => (key === me ? "You" : <UserText>{nameOf(key)}</UserText>);
  const isHost = me === state.host;
  const back = (
    <Link href="/games/play" className={`${ui.primary} ${ui.big}`}>
      Back to games
    </Link>
  );

  if (state.end?.status === "finished") {
    return (
      <main className={ui.page}>
        <YahtzeeResults game={game} participants={people} meKey={me}>
          <Recap game={game} nameOf={nameOf} />
          <div className={ui.endActions}>
            {isHost && <Rematch others={game.players.filter((key) => key !== me)} router={router} />}
            {back}
          </div>
        </YahtzeeResults>
      </main>
    );
  }
  if (state.end) {
    return (
      <Ended title="Yahtzee">
        {state.end.reason === "ended" ? (
          <>{isHost ? "You" : <UserText>{nameOf(state.host)}</UserText>} ended the game. Nobody wins and nothing was recorded.</>
        ) : state.end.reason === "dismissed" ? (
          "The host ran out of time, so the game was dismissed. Nobody wins and nothing was recorded."
        ) : (
          "Everyone else left, so the game ended. Nobody wins and nothing was recorded."
        )}
        <span className={styles.endScores}>
          {[...people]
            .sort((a, b) => totals(game.sheets[b.key]).total - totals(game.sheets[a.key]).total)
            .map((p) => (
              <span key={p.key}>
                {p.key === me ? "You" : <UserText>{p.name}</UserText>} {totals(game.sheets[p.key]).total}
              </span>
            ))}
        </span>
      </Ended>
    );
  }
  if (!game.players.includes(me)) {
    return <Ended title="Yahtzee">The host removed you from this game after your turn ran out.</Ended>;
  }

  const left = endsAt === null ? null : endsAt - now;
  const { phase } = state.timer;
  const request = state.endRequest;

  let banner = null;
  if (phase === "turn") {
    banner = (
      <p className={`${styles.clock} ${left < 10_000 ? styles.clockLow : ""}`}>{clock(left)} left</p>
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

  const last = state.last;
  const feed = last && (
    <p className={styles.feed}>
      <span className={styles.feedDot} aria-hidden="true" />
      <span>
        <strong>{name(last.player)}</strong>{" "}
        {last.skipped ? "ran out of time:" : "scored"} {last.points} in {LABELS[last.category]?.toLowerCase()}
      </span>
    </p>
  );

  const actions = (
    <>
      <button
        type="button"
        className={styles.topButton}
        aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
        data-tip={soundOn ? "Sound on" : "Sound off"}
        data-tip-pos="below"
        onClick={() => setSoundOn(!soundOn)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {soundOn ? <path d="M17 8a5 5 0 0 1 0 8" /> : <path d="M17 9l5 6M22 9l-5 6" />}
        </svg>
      </button>
      {isHost ? (
        <button type="button" className={styles.topButton} onClick={() => setConfirm("end")}>
          End game
        </button>
      ) : request?.by === me ? (
        <span className={styles.topButton}>Asked to end</span>
      ) : (
        <button type="button" className={styles.topButton} disabled={Boolean(request)} onClick={() => setConfirm("ask")}>
          Ask to end
        </button>
      )}
    </>
  );

  return (
    <main className={ui.page}>
      <YahtzeeBoard
        game={{ ...game, held }}
        participants={people}
        meKey={me}
        canAct={active === me && !busy}
        rolling={rolling}
        moved={seen.moved}
        rollId={seen.rollId}
        onRoll={roll}
        onHold={(index) => setHeld((current) => current.map((on, i) => (i === index ? !on : on)))}
        onScore={(category) => send({ action: "move", move: { type: "score", category } })}
        timer={phase === "turn" && left !== null ? { left, total: yahtzeeOnline.turnMs } : null}
        presence={live.online}
        reactions={live.reactions}
        actions={actions}
        banner={
          <>
            {isHost && request && (
              <div className={styles.request} role="status">
                <span>
                  <UserText>{nameOf(request.by)}</UserText> asks to end the game
                </span>
                <div className={styles.requestActions}>
                  <button type="button" className={styles.requestEnd} disabled={busy} onClick={() => send({ action: "end" })}>
                    End game
                  </button>
                  <button type="button" className={styles.requestKeep} disabled={busy} onClick={() => send({ action: "keep" })}>
                    Keep playing
                  </button>
                </div>
              </div>
            )}
            {banner}
            {error && (
              <p role="alert" className={ui.problem}>
                {error}
              </p>
            )}
          </>
        }
        feed={feed}
        footer={
          <div className={styles.reactions} role="group" aria-label="Reactions">
            {REACTIONS.map((label) => (
              <button key={label} type="button" className={styles.reaction} onClick={() => live.react(label)}>
                {label}
              </button>
            ))}
          </div>
        }
      />

      {seen.yahtzee && (
        <div key={seen.rollId} className={styles.flash} aria-live="polite">
          Yahtzee!
        </div>
      )}

      {confirm && (
        <div className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby="end-title">
          <div className={styles.confirmPanel}>
            <h2 id="end-title">
              {confirm === "end" ? "End the game for everyone?" : <>Ask <UserText>{nameOf(state.host)}</UserText> to end the game?</>}
            </h2>
            <p>
              {confirm === "end"
                ? "Nobody wins and nothing is recorded."
                : "The host decides. If the game ends, nobody wins and nothing is recorded."}
            </p>
            <button
              type="button"
              className={`${ui.primary} ${ui.big}`}
              disabled={busy}
              onClick={async () => {
                const done = await send({ action: confirm === "end" ? "end" : "request_end" });
                if (done) setConfirm(null);
              }}
            >
              {confirm === "end" ? "End game" : "Send request"}
            </button>
            <button type="button" className={`${styles.requestKeep} ${ui.big}`} onClick={() => setConfirm(null)}>
              Keep playing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Three facts about a finished game: the margin, the best box and the
// Yahtzees.
function Recap({ game, nameOf }) {
  const scores = game.players.map((key) => ({ key, total: totals(game.sheets[key]).total })).sort((a, b) => b.total - a.total);
  const margin = scores.length > 1 ? scores[0].total - scores[1].total : null;
  let top = null;
  for (const key of game.players) {
    for (const item of CATEGORIES) {
      const points = game.sheets[key].boxes[item.id] ?? 0;
      if (!top || points > top.points) top = { key, category: item.id, points };
    }
  }
  const yahtzees = game.players
    .map((key) => ({
      key,
      count: (game.sheets[key].boxes.yahtzee === 50 ? 1 : 0) + game.sheets[key].yahtzeeBonus,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className={styles.recap}>
      {margin !== null && (
        <span className={styles.recapItem}>
          {margin === 0 ? "A tie at the top" : "Won by"}
          <strong>{margin === 0 ? "Shared win" : `${margin} points`}</strong>
        </span>
      )}
      {top && top.points > 0 && (
        <span className={styles.recapItem}>
          Best box
          <strong>
            <UserText>{nameOf(top.key)}</UserText>: {top.points} in {LABELS[top.category].toLowerCase()}
          </strong>
        </span>
      )}
      <span className={styles.recapItem}>
        Yahtzees
        <strong>
          {yahtzees.length === 0
            ? "None this time"
            : yahtzees.map((item, index) => (
                <span key={item.key}>
                  {index > 0 && ", "}
                  <UserText>{nameOf(item.key)}</UserText> {item.count > 1 ? `×${item.count}` : ""}
                </span>
              ))}
        </strong>
        {yahtzees.length > 0 && <span>Each extra one is +{YAHTZEE_BONUS}</span>}
      </span>
    </div>
  );
}

// A new room with the same players. They get fresh invites.
function Rematch({ others, router }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function start() {
    setBusy(true);
    setError(null);
    const result = await createRoom("yahtzee", others);
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.push(`/play/yahtzee/room/${result.id}`);
  }

  return (
    <>
      <button type="button" className={`${ui.ghost} ${ui.big}`} disabled={busy || others.length === 0} onClick={start}>
        Rematch with the same players
      </button>
      {error && (
        <p role="alert" className={ui.problem}>
          {error}
        </p>
      )}
    </>
  );
}
