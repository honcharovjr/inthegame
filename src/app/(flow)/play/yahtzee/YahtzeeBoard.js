"use client";

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
  hasRolled,
  options,
  round,
  totals,
} from "@/lib/games/yahtzee/rules";
import TopBar from "../shared/TopBar";
import ui from "../shared/play.module.css";
import styles from "./yahtzee.module.css";

export const LABELS = Object.fromEntries([...UPPER, ...LOWER].map((item) => [item.id, item.label]));

// The Yahtzee table: players, dice, roll and score, and the score sheet.
// Shared by the game on one device and the online game; the parent owns the
// game and decides what a roll, a hold or a score does.
// participants: [{ key, name, color, registered, character }], keyed like
// game.players. meKey is shown as "You". canAct is false while it is not
// this device's turn. moved and rollId make only the rolled dice tumble.
// banner sits above the dice, for example a turn timer.
export default function YahtzeeBoard({
  game,
  participants,
  meKey,
  canAct = true,
  selected,
  onSelect,
  viewing,
  onView,
  moved,
  rollId,
  onRoll,
  onHold,
  onScore,
  banner,
}) {
  const person = (key) => participants.find((item) => item.key === key);
  const active = currentPlayer(game);
  const sheetKey = viewing ?? active;
  const sheet = game.sheets[sheetKey];
  const own = sheetKey === active;
  const rolled = hasRolled(game);
  const choices = own && rolled && canAct ? options(sheet, game.dice) : {};
  const sum = totals(sheet);

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
          onClick={() => onSelect(on ? null : item.id)}
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
              onClick={() => onView(item.key === active ? null : item.key)}
              aria-label={`${item.name}: ${totals(game.sheets[item.key]).total} points. Show sheet`}
            >
              <Avatar name={item.name} size={30} color={item.color} registered={item.registered} character={item.character} />
              <span className={ui.playerName}>
                {item.key === meKey ? "You" : <UserText>{item.name}</UserText>}
              </span>
              <span className={ui.playerTotal}>{totals(game.sheets[item.key]).total}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.layout}>
        <section className={styles.table} aria-label="Dice">
          <p className={styles.turn}>
            {active === meKey ? "Your turn" : <><UserText>{person(active)?.name}</UserText>&apos;s turn</>}
          </p>
          {banner}
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
                  disabled={!canAct || !rolled || game.rollsLeft === 0}
                  aria-pressed={held}
                  aria-label={rolled ? `Die ${index + 1}: ${face}${held ? ", held" : ""}` : `Die ${index + 1}`}
                  onClick={() => onHold(index)}
                >
                  <Die face={face} size={58} blank={!rolled} />
                  <span className={styles.heldTag}>{held ? "Held" : ""}</span>
                </button>
              );
            })}
          </div>
          <p className={styles.tip}>
            {!canAct
              ? "Watch the dice. Your turn comes soon."
              : !rolled
                ? "Roll to start the turn."
                : game.rollsLeft > 0
                  ? "Tap dice to hold them, then roll again or pick a box."
                  : "No rolls left. Pick a box."}
          </p>

          <div className={styles.actions}>
            <button type="button" className={styles.roll} disabled={!canAct || game.rollsLeft === 0} onClick={onRoll}>
              Roll
              <span className={styles.rollDots} aria-label={`${game.rollsLeft} rolls left`}>
                {Array.from({ length: ROLLS_PER_TURN }, (_, index) => (
                  <span key={index} className={index < game.rollsLeft ? styles.dotOn : styles.dot} />
                ))}
              </span>
            </button>
            <button type="button" className={ui.primary} disabled={!canAct || !selected} onClick={onScore}>
              {selected && canAct ? `Score ${choices[selected]} in ${LABELS[selected]}` : "Pick a box"}
            </button>
          </div>
        </section>

        <section className={styles.sheet} aria-label="Score sheet">
          {!own && (
            <div className={styles.viewing}>
              <span>
                {sheetKey === meKey ? "Your" : <><UserText>{person(sheetKey)?.name}</UserText>&apos;s</>} sheet
              </span>
              <button type="button" className={ui.link} onClick={() => onView(null)}>
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
          <ul className={styles.boxes}>{UPPER.map(sheetRow)}</ul>
          <div className={styles.sectionHead}>
            <span>Lower section</span>
            {sum.yahtzeeBonus > 0 && <span className={styles.bonusText}>Yahtzee bonus +{sum.yahtzeeBonus}</span>}
          </div>
          <ul className={styles.boxes}>{LOWER.map(sheetRow)}</ul>
          <div className={styles.total}>
            <span>Total</span>
            <span>{sum.total}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
