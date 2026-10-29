"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Die from "@/components/Die/Die";
import UserText from "@/components/UserText/UserText";
import {
  LOWER,
  ROLLS_PER_TURN,
  ROUNDS,
  UPPER,
  UPPER_BONUS,
  UPPER_BONUS_AT,
  currentPlayer,
  finalScores,
  hasRolled,
  isOver,
  isValidGame,
  isYahtzee,
  newGame,
  options,
  roll,
  round,
  score,
  toggleHold,
  totals,
} from "@/lib/games/yahtzee/rules";
import { placesFromScores } from "@/lib/sessions/places";
import Handoff from "../shared/Handoff";
import ModeScreen from "../shared/ModeScreen";
import { SetupScreen, usePlayerSetup } from "../shared/PlayerSetup";
import TopBar from "../shared/TopBar";
import ui from "../shared/play.module.css";
import { createGameStore } from "../shared/store";
import styles from "./yahtzee.module.css";

// The game in progress lives in the browser. Cleared when the game ends.
const store = createGameStore("itg.yahtzee", isValidGame);

const LABELS = Object.fromEntries([...UPPER, ...LOWER].map((item) => [item.id, item.label]));

// Yahtzee in the app: solo, or with friends passing one phone. Playing with
// friends on their own phones by invite is planned; its option is shown as
// coming soon. Results are not saved to history or ratings yet.
export default function YahtzeeGame({ profile, initialGuests, teams, maxPlayers }) {
  // mode | setup | play | over
  const [stage, setStage] = useState("mode");
  const raw = useSyncExternalStore(store.subscribe, store.readRaw, () => null);
  const stored = store.parse(raw, profile.id);
  const setup = usePlayerSetup({ profile, initialGuests, teams, maxPlayers });
  const { lineup, teamId, setTeamId } = setup;

  // Play
  const [participants, setParticipants] = useState([]);
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const [rollId, setRollId] = useState(0);
  // Which dice moved in the last roll, so only they tumble.
  const [moved, setMoved] = useState([]);
  const [flash, setFlash] = useState(false);

  // Keep the game in the browser after every move, and forget it once over.
  useEffect(() => {
    if (stage === "over") store.write(null);
    else if (stage === "play" && game) {
      store.write({ profileId: profile.id, participants, teamId, game });
    }
  }, [stage, game, participants, teamId, profile.id]);

  function begin(players, nextGame, nextTeamId) {
    setParticipants(players);
    setTeamId(nextTeamId);
    setGame(nextGame);
    setSelected(null);
    setViewing(null);
    setHandoff(null);
    setStage(isOver(nextGame) ? "over" : "play");
  }

  function startSolo() {
    begin([setup.me], newGame(["me"]), null);
  }

  function start() {
    begin(lineup, newGame(lineup.map((person) => person.key)), teamId);
  }

  function resume() {
    begin(stored.participants, stored.game, stored.teamId ?? null);
  }

  function discard() {
    store.write(null);
  }

  function rematch() {
    begin(participants, newGame(participants.map((person) => person.key)), teamId);
  }

  const person = (key) => participants.find((item) => item.key === key);

  function doRoll() {
    const next = roll(game);
    setMoved(hasRolled(game) ? game.held.map((held) => !held) : game.dice.map(() => true));
    setGame(next);
    setSelected(null);
    setViewing(null);
    setRollId((id) => id + 1);
    if (isYahtzee(next.dice)) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
  }

  function doScore() {
    if (!selected) return;
    const who = currentPlayer(game);
    const points = options(game.sheets[who], game.dice)[selected];
    const next = score(game, selected);
    setGame(next);
    setSelected(null);
    setViewing(null);
    if (isOver(next)) {
      setStage("over");
    } else if (participants.length > 1) {
      setHandoff({ who, category: selected, points });
    }
  }

  if (stage === "mode") {
    return (
      <ModeScreen
        title="Yahtzee"
        soloArt={<Die face={1} size={44} className={ui.modeDie} />}
        soloText="Just you and the dice. Chase your best score."
        maxPlayers={maxPlayers}
        onSolo={startSolo}
        onPhone={() => setStage("setup")}
        resume={
          stored && {
            participants: stored.participants,
            progress: `round ${round(stored.game)} of ${ROUNDS}`,
            onContinue: resume,
            onDiscard: discard,
          }
        }
      />
    );
  }

  if (stage === "setup") {
    return <SetupScreen title="Yahtzee" setup={setup} onBack={() => setStage("mode")} onStart={start} />;
  }

  if (stage === "over") {
    const scores = finalScores(game);
    const places = placesFromScores(scores);
    const ranked = [...participants].sort((a, b) => places[a.key] - places[b.key]);
    const winners = ranked.filter((item) => places[item.key] === 1);
    const headline =
      participants.length === 1
        ? `You scored ${scores.me}!`
        : winners.length > 1
        ? "A tie at the top!"
        : winners[0].key === "me"
          ? "You win!"
          : <><UserText>{winners[0].name}</UserText> wins!</>;

    return (
      <main className={ui.page}>
        <div className={ui.column}>
          <TopBar title="Yahtzee" backHref="/games/play" />
          <div className={styles.confetti} aria-hidden="true">
            {[6, 5, 4, 3, 2, 1].map((face, index) => (
              <Die key={face} face={face} size={34} className={styles.confettiDie} style={{ "--i": index }} />
            ))}
          </div>
          <h1 className={ui.headline}>{headline}</h1>

          <ol className={`${ui.results} stagger`}>
            {ranked.map((item) => {
              const sum = totals(game.sheets[item.key]);
              const first = places[item.key] === 1;
              return (
                <li key={item.key} className={`${ui.resultRow} ${first ? ui.resultWin : ""}`}>
                  {participants.length > 1 && <span className={ui.place}>{places[item.key]}</span>}
                  <Avatar name={item.name} size={44} color={item.color} registered={item.registered} character={item.character} />
                  <span className={ui.resultText}>
                    <span className={ui.resultName}>
                      {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
                    </span>
                    <span className={ui.resultMeta}>
                      Upper {sum.upper}
                      {sum.upperBonus ? ` +${sum.upperBonus}` : ""} · Lower {sum.lower}
                      {sum.yahtzeeBonus ? ` · Bonus ${sum.yahtzeeBonus}` : ""}
                    </span>
                  </span>
                  <span className={ui.resultTotal}>{sum.total}</span>
                </li>
              );
            })}
          </ol>

          <p className={ui.note}>In-app games are not saved to your history yet.</p>

          <div className={ui.endActions}>
            <button type="button" className={`${ui.primary} ${ui.big}`} onClick={rematch}>
              Play again
            </button>
            <Link href="/games/play" className={`${ui.ghost} ${ui.big}`}>
              Done
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Play
  const active = currentPlayer(game);
  const sheetKey = viewing ?? active;
  const sheet = game.sheets[sheetKey];
  const own = sheetKey === active;
  const rolled = hasRolled(game);
  const choices = own && rolled ? options(sheet, game.dice) : {};
  const sum = totals(sheet);
  const next = handoff ? person(active) : null;

  function sheetRow(item) {
    const value = sheet.boxes[item.id];
    const open = value === null;
    const can = item.id in choices;
    const on = selected === item.id;
    return (
      <li key={item.id}>
        <button
          type="button"
          className={`${styles.box} ${open ? "" : styles.boxDone} ${can ? styles.boxCan : ""} ${on ? styles.boxOn : ""}`}
          disabled={!can}
          aria-pressed={on}
          onClick={() => setSelected(on ? null : item.id)}
        >
          <span className={styles.boxText}>
            <span className={styles.boxLabel}>{item.label}</span>
            <span className={styles.boxHint}>{item.hint}</span>
          </span>
          <span className={`${styles.boxValue} ${can && choices[item.id] === 0 ? styles.boxZero : ""}`}>
            {open ? (can ? choices[item.id] : "") : value}
          </span>
        </button>
      </li>
    );
  }

  return (
    <main className={ui.page}>
      <div className={`${ui.column} ${styles.playColumn}`}>
        <TopBar title="Yahtzee" backHref="/games/play">
          <span className={styles.round}>
            Round {round(game)} of {ROUNDS}
          </span>
        </TopBar>

        <div className={ui.players}>
          {participants.map((item) => {
            const isActive = item.key === active;
            const isViewed = item.key === sheetKey;
            return (
              <button
                key={item.key}
                type="button"
                className={`${ui.player} ${isActive ? ui.playerActive : ""} ${isViewed && !isActive ? ui.playerViewed : ""}`}
                onClick={() => setViewing(item.key === active ? null : item.key)}
                aria-label={`${item.name}: ${totals(game.sheets[item.key]).total} points. Show sheet`}
              >
                <Avatar name={item.name} size={30} color={item.color} registered={item.registered} character={item.character} />
                <span className={ui.playerName}>
                  {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
                </span>
                <span className={ui.playerTotal}>{totals(game.sheets[item.key]).total}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.layout}>
          <section className={styles.table} aria-label="Dice">
            <p className={styles.turn}>
              {active === "me" ? "Your turn" : <><UserText>{person(active).name}</UserText>&apos;s turn</>}
            </p>
            <div className={styles.tray}>
              {game.dice.map((face, index) => {
                const held = game.held[index];
                const tumbles = rolled && moved[index];
                return (
                  <button
                    key={`${index}-${tumbles ? rollId : "still"}`}
                    type="button"
                    className={`${styles.dieButton} ${held ? styles.held : ""} ${tumbles ? styles.tumble : ""}`}
                    style={{ "--i": index }}
                    disabled={!rolled || game.rollsLeft === 0}
                    aria-pressed={held}
                    aria-label={rolled ? `Die ${index + 1}: ${face}${held ? ", held" : ""}` : `Die ${index + 1}`}
                    onClick={() => setGame(toggleHold(game, index))}
                  >
                    <Die face={face} size={58} blank={!rolled} />
                    <span className={styles.heldTag}>{held ? "Held" : ""}</span>
                  </button>
                );
              })}
            </div>
            <p className={styles.tip}>
              {!rolled
                ? "Roll to start the turn."
                : game.rollsLeft > 0
                  ? "Tap dice to hold them, then roll again or pick a box."
                  : "No rolls left. Pick a box."}
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.roll}
                disabled={game.rollsLeft === 0}
                onClick={doRoll}
              >
                Roll
                <span className={styles.rollDots} aria-label={`${game.rollsLeft} rolls left`}>
                  {Array.from({ length: ROLLS_PER_TURN }, (_, index) => (
                    <span key={index} className={index < game.rollsLeft ? styles.dotOn : styles.dot} />
                  ))}
                </span>
              </button>
              <button
                type="button"
                className={ui.primary}
                disabled={!selected}
                onClick={doScore}
              >
                {selected ? `Score ${choices[selected]} in ${LABELS[selected]}` : "Pick a box"}
              </button>
            </div>
          </section>

          <section className={styles.sheet} aria-label="Score sheet">
            {!own && (
              <div className={styles.viewing}>
                <span>
                  <UserText>{person(sheetKey).name}</UserText>&apos;s sheet
                </span>
                <button type="button" className={ui.link} onClick={() => setViewing(null)}>
                  Back to the turn
                </button>
              </div>
            )}
            <div className={styles.sectionHead}>
              <span>Upper section</span>
              <span className={styles.bonusText}>
                {sum.upperBonus ? `Bonus +${UPPER_BONUS}` : `${sum.upper} of ${UPPER_BONUS_AT} for +${UPPER_BONUS}`}
              </span>
            </div>
            <div className={styles.bonusBar} aria-hidden="true">
              <span style={{ width: `${Math.min(100, (sum.upper / UPPER_BONUS_AT) * 100)}%` }} />
            </div>
            <ul className={styles.boxes}>
              {UPPER.map(sheetRow)}
            </ul>
            <div className={styles.sectionHead}>
              <span>Lower section</span>
              {sum.yahtzeeBonus > 0 && <span className={styles.bonusText}>Yahtzee bonus +{sum.yahtzeeBonus}</span>}
            </div>
            <ul className={styles.boxes}>
              {LOWER.map(sheetRow)}
            </ul>
            <div className={styles.total}>
              <span>Total</span>
              <span>{sum.total}</span>
            </div>
          </section>
        </div>
      </div>

      {flash && (
        <div className={styles.flash} aria-live="polite">
          Yahtzee!
        </div>
      )}

      {handoff && next && (
        <Handoff
          next={next}
          onReady={() => setHandoff(null)}
          message={
            <>
              {handoff.who === "me" ? "You" : <UserText>{person(handoff.who).name}</UserText>} scored{" "}
              <strong>{handoff.points}</strong> in {LABELS[handoff.category]}
            </>
          }
        />
      )}
    </main>
  );
}
