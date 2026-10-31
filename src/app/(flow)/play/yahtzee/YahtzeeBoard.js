"use client";

import { useEffect } from "react";
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
  YAHTZEE_BONUS,
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

// Row names short enough for a narrow sheet, and the hint shown on hover:
// what the box needs and, where it is one number, what it scores.
const ROWS = {
  ones: ["1s", "Only 1s count"],
  twos: ["2s", "Only 2s count"],
  threes: ["3s", "Only 3s count"],
  fours: ["4s", "Only 4s count"],
  fives: ["5s", "Only 5s count"],
  sixes: ["6s", "Only 6s count"],
  threeKind: ["3 of a kind", "3 dice the same", "sum"],
  fourKind: ["4 of a kind", "4 dice the same", "sum"],
  fullHouse: ["full house", "3 + 2 of a kind", "25"],
  smallStraight: ["sm straight", "4 in a row", "30"],
  largeStraight: ["lg straight", "5 in a row", "40"],
  yahtzee: ["yahtzee", "5 of a kind", "50"],
  chance: ["chance", "Any dice", "sum"],
};

// The time on a turn, for the ring around the player on turn.
const RING = 2 * Math.PI * 17;

// The Yahtzee table, shared by the game on one device and the online game:
// the dice, then one score sheet with a column per player. Clicking the
// points a box would give scores it at once. The parent owns the game.
// participants: [{ key, name, color, registered, character }], keyed like
// game.players. meKey is shown as "You". canAct is false while this device
// waits for another player. rolling shakes the loose dice until a roll
// arrives. timer: { left, total } in ms for the player on turn, or null.
// presence: a Set of keys online, or null. reactions: { key: { label, id } }.
// actions sit in the top bar; banner above the dice; feed under them;
// footer under the sheet.
export default function YahtzeeBoard({
  game,
  participants,
  meKey,
  canAct = true,
  rolling = false,
  moved,
  rollId,
  onRoll,
  onHold,
  onScore,
  timer = null,
  presence = null,
  reactions = {},
  actions,
  banner,
  feed,
  footer,
}) {
  const person = (key) => participants.find((item) => item.key === key);
  const active = currentPlayer(game);
  const rolled = hasRolled(game);
  const mine = canAct && active === meKey;
  const choices = canAct && rolled ? options(game.sheets[active], game.dice) : {};
  const best = Object.entries(choices).reduce(
    (top, [id, points]) => (points > 0 && (top === null || points > choices[top]) ? id : top),
    null,
  );
  const canRoll = canAct && !rolling && game.rollsLeft > 0;
  const canHold = canAct && !rolling && rolled && game.rollsLeft > 0;

  // Desktop keys: space rolls, 1 to 5 hold a die.
  useEffect(() => {
    function onKey(event) {
      if (event.target.closest?.("button, a, input, textarea, select")) return;
      if (event.key === " " && canRoll) {
        event.preventDefault();
        onRoll();
      } else if (/^[1-5]$/.test(event.key) && canHold) {
        onHold(Number(event.key) - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canRoll, canHold, onRoll, onHold]);

  const columns = { "--cols": participants.length };
  const col = (key) => (key === active ? styles.colOn : "");

  function scoreRow(item) {
    const [label, hint, value] = ROWS[item.id];
    return (
      <div key={item.id} className={styles.row}>
        <span className={styles.rowName} tabIndex={0} data-tip={hint} data-tip-value={value}>
          {label}
        </span>
        {participants.map((p) => {
          const box = game.sheets[p.key].boxes[item.id];
          const open = box === null;
          const can = p.key === active && item.id in choices;
          return (
            <span key={p.key} className={`${styles.cell} ${col(p.key)}`}>
              {!open ? (
                box
              ) : can ? (
                <button
                  type="button"
                  className={`${styles.pick} ${choices[item.id] === 0 ? styles.pickZero : ""}`}
                  onClick={() => onScore(item.id)}
                  aria-label={`Score ${choices[item.id]} in ${LABELS[item.id]}`}
                >
                  {choices[item.id]}
                  {item.id === best && <span className={styles.star} aria-hidden="true" />}
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`${ui.column} ${styles.playColumn}`}>
      <TopBar title="Yahtzee" backHref="/games/play">
        <span className={styles.topRight}>
          <span className={styles.round}>
            Round {round(game)} of {ROUNDS}
          </span>
          {actions}
        </span>
      </TopBar>

      <div className={styles.layout}>
        <section className={styles.table} aria-label="Dice">
          <p className={styles.turn}>
            {active === meKey ? "Your turn" : <><UserText>{person(active)?.name}</UserText>&apos;s turn</>}
          </p>
          {banner}
          <div className={`${styles.tray} ${mine ? styles.trayMine : ""} ${canAct ? "" : styles.trayIdle}`}>
            {mine && <span className={styles.trayTag}>You&apos;re rolling</span>}
            <div className={styles.dice}>
              {game.dice.map((face, index) => {
                const held = game.held[index];
                const tumbles = rolled && moved[index];
                return (
                  <button
                    key={`${index}-${tumbles ? rollId : "still"}`}
                    type="button"
                    className={`${styles.dieButton} ${held ? styles.held : ""} ${tumbles ? styles.tumble : ""} ${rolling && !held ? styles.shaking : ""}`}
                    style={{ "--i": index }}
                    disabled={!canHold}
                    aria-pressed={held}
                    aria-label={rolled ? `Die ${index + 1}: ${face}${held ? ", held" : ""}` : `Die ${index + 1}`}
                    onClick={() => onHold(index)}
                  >
                    <Die face={face} size={52} blank={!rolled} />
                    <span className={styles.heldTag}>{held ? "Held" : ""}</span>
                  </button>
                );
              })}
            </div>
            <p className={styles.tip}>
              {!canAct ? (
                <>
                  Watching <UserText>{person(active)?.name}</UserText> roll
                </>
              ) : !rolled ? (
                "Roll to start the turn."
              ) : game.rollsLeft > 0 ? (
                "Hold dice, roll again, or tap the points of a box."
              ) : (
                "No rolls left. Tap the points of a box."
              )}
            </p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.roll} disabled={!canRoll} onClick={onRoll}>
              {canAct ? "Roll" : "Waiting"}
              <span className={styles.rollDots} aria-label={`${game.rollsLeft} rolls left`}>
                {Array.from({ length: ROLLS_PER_TURN }, (_, index) => (
                  <span key={index} className={index < game.rollsLeft ? styles.dotOn : styles.dot} />
                ))}
              </span>
            </button>
          </div>
          {feed}
        </section>

        <section className={styles.sheet} aria-label="Score sheet" style={columns}>
          <div className={`${styles.row} ${styles.heads}`}>
            <span />
            {participants.map((p) => {
              const on = p.key === active;
              const reaction = reactions[p.key];
              return (
                <span key={p.key} className={`${styles.head} ${col(p.key)}`}>
                  <span className={styles.face} data-tip={p.key === meKey ? "You" : p.name} tabIndex={0}>
                    <Avatar name={p.name} size={30} color={p.color} registered={p.registered} character={p.character} />
                    {on && timer && (
                      <svg className={styles.ring} viewBox="0 0 40 40" aria-hidden="true">
                        <circle
                          cx="20"
                          cy="20"
                          r="17"
                          style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - Math.max(0, timer.left) / timer.total) }}
                        />
                      </svg>
                    )}
                    {presence && (
                      <span className={`${styles.presence} ${presence.has(p.key) ? styles.online : ""}`} />
                    )}
                  </span>
                  {reaction && (
                    <span key={reaction.id} className={styles.sticker}>
                      {reaction.label}
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          <div className={styles.card}>
            {UPPER.map(scoreRow)}
            <div className={`${styles.row} ${styles.bonusRow}`}>
              <span className={styles.rowName} tabIndex={0} data-tip={`Reach ${UPPER_BONUS_AT} in 1s to 6s`} data-tip-value={`+${UPPER_BONUS}`}>
                <span className={styles.chest} aria-hidden="true" />
                bonus
              </span>
              {participants.map((p) => {
                const sum = totals(game.sheets[p.key]);
                return (
                  <span key={p.key} className={`${styles.cell} ${col(p.key)}`}>
                    {sum.upperBonus ? (
                      <span className={styles.bonusWon}>+{UPPER_BONUS}</span>
                    ) : (
                      <span className={styles.meter} data-tip={`${sum.upper} of ${UPPER_BONUS_AT}`} tabIndex={0}>
                        <span style={{ width: `${Math.min(100, (sum.upper / UPPER_BONUS_AT) * 100)}%` }} />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          <div className={styles.card}>
            {LOWER.map(scoreRow)}
            {participants.some((p) => game.sheets[p.key].yahtzeeBonus > 0) && (
              <div className={styles.row}>
                <span className={styles.rowName} tabIndex={0} data-tip="Each extra Yahtzee" data-tip-value={`+${YAHTZEE_BONUS}`}>
                  yahtzee bonus
                </span>
                {participants.map((p) => (
                  <span key={p.key} className={`${styles.cell} ${col(p.key)}`}>
                    {game.sheets[p.key].yahtzeeBonus > 0 ? `+${game.sheets[p.key].yahtzeeBonus * YAHTZEE_BONUS}` : null}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`${styles.row} ${styles.totalRow}`}>
            <span className={styles.rowName}>total</span>
            {participants.map((p) => (
              <span key={p.key} className={styles.cell}>
                {totals(game.sheets[p.key]).total}
              </span>
            ))}
          </div>
          {footer}
        </section>
      </div>
    </div>
  );
}
