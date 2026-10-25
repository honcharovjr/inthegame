"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import AddGameForm from "@/components/AddGameForm/AddGameForm";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import FlowShell from "@/components/FlowShell/FlowShell";
import IconButton from "@/components/IconButton/IconButton";
import GameMeta from "@/components/GameMeta/GameMeta";
import { PlusIcon } from "@/components/icons";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
import { playerColor } from "@/lib/sessions/colors";
import { createGuest, saveSession } from "@/lib/sessions/actions";
import { placesFromOrder } from "@/lib/sessions/places";
import RankingList from "./RankingList";
import styles from "./flow.module.css";

const RESULT_TYPES = [
  { value: "winner", label: "Winner" },
  { value: "ranking", label: "Places" },
  { value: "points", label: "Points" },
];

function toneClass(tone) {
  return styles[`tile${tone.charAt(0).toUpperCase()}${tone.slice(1)}`];
}

function Trophy() {
  return (
    <span className={styles.trophy} role="img" aria-label="Winner">
      🏆
    </span>
  );
}

const TONES = { 1: "turquoise", 2: "yellow", 3: "pink" };
const HEADLINES = { 1: "Which\ngame?", 2: "Who\nplayed?", 3: "Who\nwon?" };

// The whole log flow on one page: game, players, result. Moving between the
// steps never reloads the page. Everything it needs is passed in once.
export default function LogFlow({
  profile,
  games: initialGames,
  initialGuests,
  teams = [],
  lastSession,
}) {
  const router = useRouter();
  const [, startSaving] = useTransition();
  const [addingGuest, startAddingGuest] = useTransition();
  // idle | saving | done. Anything but idle locks the screen under an overlay.
  const [phase, setPhase] = useState("idle");
  // The previous session, kept up to date after every save. Not cleared by a
  // reset, so a fresh flow can still offer it.
  const [previous, setPrevious] = useState(lastSession);

  const [games, setGames] = useState(initialGames);
  const [addingGame, setAddingGame] = useState(false);
  const [step, setStep] = useState(1);
  const [gameId, setGameId] = useState(null);
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState(initialGuests);
  const [selected, setSelected] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState(null);

  const [resultType, setResultType] = useState("ranking");
  const [winner, setWinner] = useState("me");
  const [order, setOrder] = useState([]);
  const [tied, setTied] = useState({});
  const [scores, setScores] = useState({});
  const [tiebreak, setTiebreak] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Back to a clean first step. The guest list is kept, new guests stay.
  function resetFlow() {
    setStep(1);
    setGameId(null);
    setQuery("");
    setSelected([]);
    setTeamId(null);
    setSelectedMembers([]);
    setGuestName("");
    setGuestError(null);
    setResultType("ranking");
    setWinner("me");
    setOrder([]);
    setTied({});
    setScores({});
    setTiebreak(null);
    setChoosing(false);
    setSaveError(null);
    setPhase("idle");
  }

  // The app keeps pages it left alive in the background. When this page goes
  // away, start over, so the next visit begins at the first step.
  useEffect(() => () => resetFlow(), []);

  const game = games.find((item) => item.id === gameId) ?? null;

  const team = teams.find((item) => item.id === teamId) ?? null;
  const teammates = team
    ? team.members.filter((member) => member.id !== profile.id)
    : [];
  const chosenMembers = teammates.filter((member) =>
    selectedMembers.includes(member.id),
  );
  const chosenGuests = guests.filter((guest) => selected.includes(guest.id));
  // Order: you, then teammates, then guests. A teammate's key starts with p:.
  const participants = [
    { key: "me", name: profile.nickname, color: playerColor(0) },
    ...chosenMembers.map((member, index) => ({
      key: `p:${member.id}`,
      name: member.nickname,
      color: playerColor(index + 1),
    })),
    ...chosenGuests.map((guest, index) => ({
      key: guest.id,
      name: guest.name,
      color: playerColor(chosenMembers.length + index + 1),
    })),
  ];

  const previousGame = previous
    ? games.find((item) => item.id === previous.gameId)
    : null;
  const previousTeam = previous?.teamId
    ? teams.find((item) => item.id === previous.teamId)
    : null;
  const previousNames = previous
    ? [
        ...(previousTeam
          ? previous.memberIds.map(
              (id) => previousTeam.members.find((m) => m.id === id)?.nickname,
            )
          : []),
        ...previous.guestIds.map(
          (id) => guests.find((guest) => guest.id === id)?.name,
        ),
      ].filter(Boolean)
    : [];

  const visibleGames = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text
      ? games.filter((item) => item.name.toLowerCase().includes(text))
      : games;
  }, [games, query]);

  const rankingPlaces = placesFromOrder(order, tied);

  // Points. A blank field counts as 0. Only one clear leader is highlighted.
  // When the top score is shared, nobody is highlighted until the player
  // assigns the winner anyway.
  function pointOf(key) {
    const value = scores[key];
    return value === undefined || value === "" || Number.isNaN(Number(value))
      ? 0
      : Number(value);
  }
  const topScore = Math.max(...participants.map((p) => pointOf(p.key)));
  const leaders = participants
    .filter((p) => pointOf(p.key) === topScore)
    .map((p) => p.key);
  const isTie = leaders.length > 1;
  const touched = Object.keys(scores).length > 0;
  const activeTiebreak =
    isTie && tiebreak && leaders.includes(tiebreak) ? tiebreak : null;
  const leaderKey = isTie ? activeTiebreak : leaders[0];
  const picking = choosing && isTie;

  function pickGame(id) {
    setGameId(id);
    setStep(2);
  }

  function toggleGuest(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleMember(id) {
    setSelectedMembers((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function chooseTeam(id) {
    setTeamId(id);
    setSelectedMembers([]);
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
      setSelected((current) => [...current, result.guest.id]);
      setGuestName("");
    });
  }

  // Fresh result inputs every time the players are confirmed.
  function enterResult() {
    setOrder(participants.map((p) => p.key));
    setTied({});
    setScores({});
    setTiebreak(null);
    setChoosing(false);
    setWinner("me");
    setSaveError(null);
    setStep(3);
  }

  function reorder(next) {
    setOrder(next);
    setTied({});
  }

  function toggleTie(key) {
    setTied((current) => ({ ...current, [key]: !current[key] }));
  }

  function bump(key, delta) {
    setScores((current) => ({
      ...current,
      [key]: String(Number(current[key] || 0) + delta),
    }));
  }

  function save() {
    setSaveError(null);
    setPhase("saving");
    startSaving(async () => {
      const result = await saveSession({
        gameId,
        resultType,
        keys: participants.map((p) => p.key),
        winner,
        places: rankingPlaces,
        scores: Object.fromEntries(
          participants.map((p) => [p.key, String(pointOf(p.key))]),
        ),
        tiebreak: activeTiebreak,
        teamId,
      });
      if (result.error) {
        setSaveError(result.error);
        setPhase("idle");
        return;
      }
      setPrevious({
        gameId,
        teamId,
        memberIds: chosenMembers.map((m) => m.id),
        guestIds: chosenGuests.map((g) => g.id),
      });
      setPhase("done");
      router.push("/?saved=1");
      // Fallback if the page stays alive: start over once Home has opened.
      setTimeout(resetFlow, 1500);
    });
  }

  // Jump to the result of the same game with the same players.
  function sameAgain() {
    if (!previous || !games.some((item) => item.id === previous.gameId)) return;
    const guestIds = previous.guestIds.filter((id) =>
      guests.some((guest) => guest.id === id),
    );
    const sameTeam = previous.teamId
      ? teams.find((item) => item.id === previous.teamId)
      : null;
    const memberIds = sameTeam
      ? previous.memberIds.filter((id) =>
          sameTeam.members.some((member) => member.id === id),
        )
      : [];
    setGameId(previous.gameId);
    setTeamId(sameTeam ? sameTeam.id : null);
    setSelectedMembers(memberIds);
    setSelected(guestIds);
    setOrder(["me", ...memberIds.map((id) => `p:${id}`), ...guestIds]);
    setTied({});
    setScores({});
    setTiebreak(null);
    setChoosing(false);
    setWinner("me");
    setSaveError(null);
    setStep(3);
  }

  function goBack() {
    if (step === 1) {
      router.push("/");
    } else {
      setStep(step - 1);
    }
  }

  return (
    <FlowShell
      step={step}
      tone={TONES[step]}
      onBack={goBack}
      headline={HEADLINES[step]}
    >
      {step === 1 && (
        <>
          <div className={styles.search}>
            <input
              className={styles.searchInput}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              aria-label="Search games"
            />
          </div>

          {!query && previousGame && (
            <button
              type="button"
              className={`${styles.again} btn-primary`}
              onClick={sameAgain}
            >
              <span className={styles.againIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
                </svg>
              </span>
              <span className={styles.againText}>
                <span className={styles.againTitle}>
                  Same again: {previousGame.name}
                </span>
                <span className={styles.againWho}>
                  {["You", ...previousNames.slice(0, 3)].join(", ")}
                  {previousNames.length > 3 ? `, +${previousNames.length - 3}` : ""}
                </span>
              </span>
            </button>
          )}

          <div className="add-anchor">
            <button
              type="button"
              className="btn-add"
              onClick={() => setAddingGame(true)}
            >
              <PlusIcon size={16} />
              Add custom game
            </button>
            {addingGame && (
              <AddGameForm
                existingNames={games.map((item) => item.name.toLowerCase())}
                onCancel={() => setAddingGame(false)}
                onAdded={(game) => {
                  setGames((current) => [...current, game]);
                  setAddingGame(false);
                  pickGame(game.id);
                }}
              />
            )}
          </div>

          {visibleGames.length === 0 && (
            <p className={styles.message}>No games match this search.</p>
          )}

          <ul className={`${styles.list} stagger`}>
            {visibleGames.map((item) => {
              const type = findGameType(item.type);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.row} ${styles.rowButton} ${gameId === item.id ? styles.rowOn : ""}`}
                    onClick={() => pickGame(item.id)}
                  >
                    <div className={`${styles.tile} ${toneClass(type.tone)}`} aria-hidden="true">
                      {gameEmoji(item)}
                    </div>
                    <div className={styles.rowText}>
                      <div className={styles.rowName}>{item.name}</div>
                      <GameMeta game={item} />
                      {item.is_classic && (
                        <div className={styles.chips}>
                          <Chip size="s" tone="turquoise">
                            Classic
                          </Chip>
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {step === 2 && game && (
        <>
          <div className={styles.chips}>
            <Chip tone="white">{game.name}</Chip>
            <Chip tone="white">
              {participants.length}{" "}
              {participants.length === 1 ? "player" : "players"}
            </Chip>
          </div>

          {teams.length > 0 && (
            <div className={styles.chips} role="group" aria-label="Team">
              <button
                type="button"
                className={`${styles.chipButton} ${!teamId ? styles.chipOn : ""}`}
                aria-pressed={!teamId}
                onClick={() => chooseTeam(null)}
              >
                No team
              </button>
              {teams.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.chipButton} ${teamId === item.id ? styles.chipOn : ""}`}
                  aria-pressed={teamId === item.id}
                  onClick={() => chooseTeam(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          <div className={styles.strip}>
            {participants.map((p) => (
              <div key={p.key} className={styles.stripItem}>
                <Avatar name={p.name} size={56} color={p.color} />
                {p.name}
              </div>
            ))}
          </div>

          <ul className={`${styles.list} stagger`}>
            <li className={styles.row}>
              <Avatar name={profile.nickname} size={40} color={playerColor(0)} />
              <span className={styles.rowText}>
                <span className={styles.rowName}>{profile.nickname}</span>
              </span>
              <Chip size="s">You</Chip>
              <span className={`${styles.check} ${styles.checkOn}`} aria-hidden="true">
                &#10003;
              </span>
            </li>
            {teammates.map((member) => {
              const on = selectedMembers.includes(member.id);
              const color = on
                ? participants.find((p) => p.key === `p:${member.id}`)?.color
                : "#c9bcc8";
              return (
                <li key={member.id}>
                  <button
                    type="button"
                    className={`${styles.row} ${styles.rowButton}`}
                    aria-pressed={on}
                    onClick={() => toggleMember(member.id)}
                  >
                    <Avatar name={member.nickname} size={40} color={color} />
                    <span className={styles.rowText}>
                      <span className={styles.rowName}>{member.nickname}</span>
                    </span>
                    <Chip size="s" tone="turquoise">
                      Teammate
                    </Chip>
                    <span
                      className={`${styles.check} ${on ? styles.checkOn : ""}`}
                      aria-hidden="true"
                    >
                      {on ? "\u2713" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
            {guests.map((guest) => {
              const on = selected.includes(guest.id);
              const color = on
                ? participants.find((p) => p.key === guest.id)?.color
                : "#c9bcc8";
              return (
                <li key={guest.id}>
                  <button
                    type="button"
                    className={`${styles.row} ${styles.rowButton}`}
                    aria-pressed={on}
                    onClick={() => toggleGuest(guest.id)}
                  >
                    <Avatar name={guest.name} size={40} color={color} />
                    <span className={styles.rowText}>
                      <span className={styles.rowName}>{guest.name}</span>
                    </span>
                    <Chip size="s" tone="pink">
                      Guest
                    </Chip>
                    <span
                      className={`${styles.check} ${on ? styles.checkOn : ""}`}
                      aria-hidden="true"
                    >
                      {on ? "✓" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <form onSubmit={submitGuest}>
            <div className={styles.guestForm}>
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
              <IconButton
                type="submit"
                tone="white"
                size={48}
                tipAlign="end"
                label="Add guest"
                icon={<PlusIcon size={22} />}
                disabled={addingGuest}
              />
            </div>
            {guestError && (
              <p role="alert" className={styles.message} style={{ marginTop: 8 }}>
                {guestError}
              </p>
            )}
          </form>

          <button
            type="button"
            className={`${styles.cta} btn-secondary`}
            disabled={participants.length < 2}
            onClick={enterResult}
          >
            {participants.length < 2 ? "Add at least one more player" : "Continue"}
          </button>
        </>
      )}

      {step === 3 && game && (
        <>
          <div className={styles.chips}>
            <Chip tone="white">{game.name}</Chip>
            <Chip tone="white">{participants.length} players</Chip>
          </div>

          <div
            className={styles.switch}
            role="group"
            aria-label="How to record the result"
          >
            {RESULT_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.switchButton} ${resultType === option.value ? styles.switchButtonOn : ""}`}
                aria-pressed={resultType === option.value}
                onClick={() => setResultType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {resultType === "winner" && (
            <ul className={`${styles.list} stagger`}>
              {participants.map((p) => {
                const won = winner === p.key;
                return (
                  <li key={p.key}>
                    <button
                      type="button"
                      className={`${styles.row} ${styles.rowButton} ${won ? styles.rowWin : ""}`}
                      aria-pressed={won}
                      onClick={() => setWinner(p.key)}
                    >
                      <Avatar name={p.name} size={44} color={p.color} />
                      <span className={styles.rowText}>
                        <span className={styles.rowName}>{p.name}</span>
                      </span>
                      <span
                        className={`${styles.pick} ${won ? styles.pickOn : ""}`}
                        aria-hidden="true"
                      >
                        {won && <Trophy />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {resultType === "ranking" && order.length === participants.length && (
            <RankingList
              participants={participants}
              order={order}
              places={rankingPlaces}
              tied={tied}
              onOrder={reorder}
              onTied={toggleTie}
            />
          )}

          {resultType === "points" && (
            <ul className={`${styles.list} stagger`}>
              {participants.map((p) => {
                const value = scores[p.key] ?? "";
                const leads = leaderKey === p.key;
                return (
                  <li
                    key={p.key}
                    className={`${styles.row} ${leads ? styles.rowWin : ""}`}
                  >
                    <Avatar name={p.name} size={44} color={p.color} />
                    <label className={styles.rowText} htmlFor={`score_${p.key}`}>
                      <span className={styles.rowName}>{p.name}</span>
                    </label>
                    {leads && <Trophy />}
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        className={styles.stepButton}
                        aria-label={`One point less for ${p.name}`}
                        data-tip="One point less"
                        onClick={() => bump(p.key, -1)}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 12h12" />
                        </svg>
                      </button>
                      <input
                        id={`score_${p.key}`}
                        className={styles.score}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="0"
                        value={value}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [p.key]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className={`${styles.stepButton} ${styles.stepPlus}`}
                        aria-label={`One point more for ${p.name}`}
                        data-tip="One point more"
                        onClick={() => bump(p.key, 1)}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 6v12M6 12h12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {resultType === "points" && isTie && touched && (
            <div className={styles.tieBox}>
              {picking ? (
                <>
                  <p className={styles.tieText}>Who takes the win?</p>
                  <div className={styles.leaderChoices}>
                    {leaders.map((key) => {
                      const person = participants.find((p) => p.key === key);
                      return (
                        <button
                          key={key}
                          type="button"
                          className={styles.leaderChoice}
                          onClick={() => {
                            setTiebreak(key);
                            setChoosing(false);
                          }}
                        >
                          <Avatar name={person.name} size={28} color={person.color} />
                          {person.name}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={`${styles.cancel} btn-secondary`}
                    onClick={() => {
                      setChoosing(false);
                      setTiebreak(null);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.tieText}>
                    {activeTiebreak
                      ? "A tie, settled by your choice."
                      : "The top score is shared."}
                  </p>
                  <button
                    type="button"
                    className={`${styles.small} btn-secondary`}
                    onClick={() => setChoosing(true)}
                  >
                    {activeTiebreak
                      ? "Choose another winner"
                      : "Assign the winner anyway"}
                  </button>
                </>
              )}
            </div>
          )}

          {saveError && (
            <p role="alert" className={styles.message}>
              {saveError}
            </p>
          )}

          <button
            type="button"
            className={`${styles.cta} btn-secondary`}
            disabled={phase !== "idle"}
            onClick={save}
          >
            {phase === "idle" ? (
              "Save session"
            ) : (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                {phase === "saving" ? "Saving your session" : "Saved"}
              </>
            )}
          </button>
        </>
      )}
      {phase !== "idle" && (
        <div className={styles.overlay} role="status" aria-live="polite">
          <div className={styles.overlayCard}>
            <span className={styles.spinner} aria-hidden="true" />
            {phase === "saving" ? "Saving your session" : "Saved. Opening Home"}
          </div>
        </div>
      )}
    </FlowShell>
  );
}
