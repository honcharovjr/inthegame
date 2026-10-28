"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Die from "@/components/Die/Die";
import UserText from "@/components/UserText/UserText";
import { ArrowLeftIcon, PlusIcon } from "@/components/icons";
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
import { playerColor } from "@/lib/sessions/colors";
import { createGuest } from "@/lib/sessions/actions";
import { placesFromScores } from "@/lib/sessions/places";
import styles from "./yahtzee.module.css";

// The game in progress lives in the browser, so a reload or a trip to
// another tab never loses it. Cleared when the game ends.
const STORAGE_KEY = "itg.yahtzee";

const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRaw() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseStored(raw, profileId) {
  try {
    const stored = JSON.parse(raw);
    if (stored?.profileId === profileId && isValidGame(stored.game)) return stored;
  } catch {
    // Something old or broken. Start fresh.
  }
  return null;
}

function writeStored(value) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Without storage the game still works, it just won't survive a reload.
  }
  listeners.forEach((listener) => listener());
}

const LABELS = Object.fromEntries([...UPPER, ...LOWER].map((item) => [item.id, item.label]));

// Yahtzee in the app: solo, or with friends passing one phone. Playing with
// friends on their own phones by invite is planned; its option is shown as
// coming soon. Results are not saved to history or ratings yet.
export default function YahtzeeGame({ profile, initialGuests, teams, maxPlayers }) {
  // mode | setup | play | over
  const [stage, setStage] = useState("mode");
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const stored = raw ? parseStored(raw, profile.id) : null;

  // Setup
  const [guests, setGuests] = useState(initialGuests);
  const [teamId, setTeamId] = useState(null);
  const [picked, setPicked] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState(null);
  const [addingGuest, startAddingGuest] = useTransition();

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
    if (stage === "over") writeStored(null);
    else if (stage === "play" && game) {
      writeStored({ profileId: profile.id, participants, teamId, game });
    }
  }, [stage, game, participants, teamId, profile.id]);

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
    const solo = [{ ...me, color: playerColor(0) }];
    begin(solo, newGame(["me"]), null);
  }

  function start() {
    begin(lineup, newGame(lineup.map((person) => person.key)), teamId);
  }

  function resume() {
    begin(stored.participants, stored.game, stored.teamId ?? null);
  }

  function discard() {
    writeStored(null);
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
      <main className={styles.page}>
        <div className={styles.column}>
          <TopBar backHref="/games/play" />
          <h1 className={styles.headline}>
            How do
            <br />
            you play?
          </h1>

          {stored && (
            <section className={styles.resume}>
              <div className={styles.resumeText}>
                <strong>Game in progress</strong>
                <span>
                  {stored.participants.length === 1
                    ? "Solo"
                    : stored.participants.map((item, index) => (
                        <span key={item.key}>
                          {index > 0 && ", "}
                          <UserText>{item.name}</UserText>
                        </span>
                      ))}{" "}
                  · round {round(stored.game)} of {ROUNDS}
                </span>
              </div>
              <div className={styles.resumeActions}>
                <button type="button" className={styles.primary} onClick={resume}>
                  Continue
                </button>
                <button type="button" className={styles.ghost} onClick={discard}>
                  Discard
                </button>
              </div>
            </section>
          )}

          <div className={`${styles.modes} stagger`}>
            <button type="button" className={`${styles.mode} ${styles.modeSolo}`} onClick={startSolo}>
              <Die face={1} size={44} className={styles.modeDie} />
              <span className={styles.modeTitle}>Solo</span>
              <span className={styles.modeText}>Just you and the dice. Chase your best score.</span>
            </button>

            <p className={styles.modeLabel}>With friends</p>
            <button type="button" className={`${styles.mode} ${styles.modePhone}`} onClick={() => setStage("setup")}>
              <span className={styles.modeTitle}>On this phone</span>
              <span className={styles.modeText}>Pass the phone around. Up to {maxPlayers} players.</span>
            </button>
            <div className={`${styles.mode} ${styles.modeSoon}`} aria-disabled="true">
              <span className={styles.soonBadge}>Coming soon</span>
              <span className={styles.modeTitle}>Invite friends</span>
              <span className={styles.modeText}>
                Send an invite. Friends get a notification and join from their own phones.
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "setup") {
    const enough = lineup.length >= 2;
    return (
      <main className={styles.page}>
        <div className={styles.column}>
          <TopBar onBack={() => setStage("mode")} />
          <h1 className={styles.headline}>
            Who&apos;s
            <br />
            playing?
          </h1>

          <div className={styles.lineup} aria-label="Players in order">
            {lineup.map((item, index) => (
              <div key={item.key} className={styles.lineupItem}>
                <span className={styles.order}>{index + 1}</span>
                <Avatar name={item.name} size={52} color={item.color} registered={item.registered} character={item.character} />
                <span className={styles.lineupName}>
                  {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
                </span>
              </div>
            ))}
          </div>

          {teams.length > 0 && (
            <div className={styles.chips} role="group" aria-label="Team">
              <button
                type="button"
                className={`${styles.chip} ${!teamId ? styles.chipOn : ""}`}
                aria-pressed={!teamId}
                onClick={() => chooseTeam(null)}
              >
                No team
              </button>
              {teams.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.chip} ${teamId === item.id ? styles.chipOn : ""}`}
                  aria-pressed={teamId === item.id}
                  onClick={() => chooseTeam(item.id)}
                >
                  <UserText>{item.name}</UserText>
                </button>
              ))}
            </div>
          )}

          <div className={styles.pool}>
            {pool
              .filter((item) => item.key !== "me")
              .map((item) => {
                const on = picked.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.poolItem} ${on ? styles.poolOn : ""}`}
                    aria-pressed={on}
                    onClick={() => togglePick(item.key)}
                  >
                    <Avatar name={item.name} size={34} color={on ? lineup.find((p) => p.key === item.key)?.color : "#5b4a63"} registered={item.registered} character={item.character} />
                    <span className={`${styles.poolName} keep-case`}>{item.name}</span>
                    <span className={styles.poolTag}>{item.tag}</span>
                  </button>
                );
              })}
          </div>

          <form onSubmit={submitGuest} className={styles.guestForm}>
            <input
              className={styles.guestInput}
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              type="text"
              maxLength={30}
              placeholder="Add a guest by name"
              aria-label="Guest name"
              required
            />
            <button
              type="submit"
              className={styles.guestAdd}
              aria-label="Add guest"
              data-tip="Add guest"
              data-tip-align="end"
              disabled={addingGuest}
            >
              <PlusIcon size={22} />
            </button>
          </form>
          {guestError && (
            <p role="alert" className={styles.problem}>
              {guestError}
            </p>
          )}

          <button type="button" className={`${styles.primary} ${styles.big}`} disabled={!enough} onClick={start}>
            {enough
              ? `Start with ${lineup.length} players`
              : "Add at least 1 more player"}
          </button>
          <p className={styles.note}>Up to {maxPlayers} players. The order above is the turn order.</p>
        </div>
      </main>
    );
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
      <main className={styles.page}>
        <div className={styles.column}>
          <TopBar backHref="/games/play" />
          <div className={styles.confetti} aria-hidden="true">
            {[6, 5, 4, 3, 2, 1].map((face, index) => (
              <Die key={face} face={face} size={34} className={styles.confettiDie} style={{ "--i": index }} />
            ))}
          </div>
          <h1 className={styles.headline}>{headline}</h1>

          <ol className={`${styles.results} stagger`}>
            {ranked.map((item) => {
              const sum = totals(game.sheets[item.key]);
              const first = places[item.key] === 1;
              return (
                <li key={item.key} className={`${styles.resultRow} ${first ? styles.resultWin : ""}`}>
                  {participants.length > 1 && <span className={styles.place}>{places[item.key]}</span>}
                  <Avatar name={item.name} size={44} color={item.color} registered={item.registered} character={item.character} />
                  <span className={styles.resultText}>
                    <span className={styles.resultName}>
                      {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
                    </span>
                    <span className={styles.resultMeta}>
                      Upper {sum.upper}
                      {sum.upperBonus ? ` +${sum.upperBonus}` : ""} · Lower {sum.lower}
                      {sum.yahtzeeBonus ? ` · Bonus ${sum.yahtzeeBonus}` : ""}
                    </span>
                  </span>
                  <span className={styles.resultTotal}>{sum.total}</span>
                </li>
              );
            })}
          </ol>

          <p className={styles.note}>In-app games are not saved to your history yet.</p>

          <div className={styles.endActions}>
            <button type="button" className={`${styles.primary} ${styles.big}`} onClick={rematch}>
              Play again
            </button>
            <Link href="/games/play" className={`${styles.ghost} ${styles.big}`}>
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
    <main className={styles.page}>
      <div className={`${styles.column} ${styles.playColumn}`}>
        <TopBar backHref="/games/play">
          <span className={styles.round}>
            Round {round(game)} of {ROUNDS}
          </span>
        </TopBar>

        <div className={styles.players}>
          {participants.map((item) => {
            const isActive = item.key === active;
            const isViewed = item.key === sheetKey;
            return (
              <button
                key={item.key}
                type="button"
                className={`${styles.player} ${isActive ? styles.playerActive : ""} ${isViewed && !isActive ? styles.playerViewed : ""}`}
                onClick={() => setViewing(item.key === active ? null : item.key)}
                aria-label={`${item.name}: ${totals(game.sheets[item.key]).total} points. Show sheet`}
              >
                <Avatar name={item.name} size={30} color={item.color} registered={item.registered} character={item.character} />
                <span className={styles.playerName}>
                  {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
                </span>
                <span className={styles.playerTotal}>{totals(game.sheets[item.key]).total}</span>
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
                className={styles.primary}
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
                <button type="button" className={styles.link} onClick={() => setViewing(null)}>
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
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Next player">
          <div className={styles.handoff}>
            <p className={styles.handoffLast}>
              {handoff.who === "me" ? "You" : <UserText>{person(handoff.who).name}</UserText>} scored{" "}
              <strong>{handoff.points}</strong> in {LABELS[handoff.category]}
            </p>
            <Avatar name={next.name} size={96} color={next.color} registered={next.registered} character={next.character} />
            <p className={styles.handoffName}>
              {next.key === "me" ? "Your turn" : <><UserText>{next.name}</UserText>&apos;s turn</>}
            </p>
            <p className={styles.handoffHint}>Pass the phone</p>
            <button type="button" className={`${styles.primary} ${styles.big}`} onClick={() => setHandoff(null)} autoFocus>
              {next.key === "me" ? "Let's go" : <span>I&apos;m <UserText>{next.name}</UserText></span>}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Give backHref for a link or onBack for a button.
function TopBar({ backHref, onBack, children }) {
  const icon = <ArrowLeftIcon size={20} />;
  return (
    <div className={styles.top}>
      {onBack ? (
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back" data-tip="Back" data-tip-pos="below">
          {icon}
        </button>
      ) : (
        <Link href={backHref} className={styles.back} aria-label="Back" data-tip="Back" data-tip-pos="below">
          {icon}
        </Link>
      )}
      <span className={styles.title}>Yahtzee</span>
      {children ?? <span />}
    </div>
  );
}
