"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Character from "@/components/Character/Character";
import Chip from "@/components/Chip/Chip";
import FlowShell from "@/components/FlowShell/FlowShell";
import { ClockIcon, UsersIcon } from "@/components/icons";
import { findGameType } from "@/lib/games/types";
import { playerColor } from "@/lib/sessions/colors";
import { createGuest, saveSession } from "@/lib/sessions/actions";
import styles from "./flow.module.css";

const RESULT_TYPES = [
  { value: "winner", label: "Winner" },
  { value: "ranking", label: "Places" },
  { value: "points", label: "Points" },
];

function formatPlayers(game) {
  return game.min_players === game.max_players
    ? `${game.min_players}`
    : `${game.min_players}-${game.max_players}`;
}

function toneClass(tone) {
  return styles[`tile${tone.charAt(0).toUpperCase()}${tone.slice(1)}`];
}

const TONES = { 1: "turquoise", 2: "yellow", 3: "pink" };
const HEADLINES = { 1: "Which\ngame?", 2: "Who\nplayed?", 3: "Who\nwon?" };

// The whole log flow on one page: game, players, result. Moving between the
// steps never reloads the page. Everything it needs is passed in once.
export default function LogFlow({ profile, games, initialGuests, recentGameIds }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [addingGuest, startAddingGuest] = useTransition();

  const [step, setStep] = useState(1);
  const [gameId, setGameId] = useState(null);
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState(initialGuests);
  const [selected, setSelected] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState(null);

  const [resultType, setResultType] = useState("ranking");
  const [winner, setWinner] = useState("me");
  const [places, setPlaces] = useState({});
  const [scores, setScores] = useState({});
  const [saveError, setSaveError] = useState(null);

  const game = games.find((item) => item.id === gameId) ?? null;

  const chosenGuests = guests.filter((guest) => selected.includes(guest.id));
  const participants = [
    { key: "me", name: profile.nickname, color: playerColor(0) },
    ...chosenGuests.map((guest, index) => ({
      key: guest.id,
      name: guest.name,
      color: playerColor(index + 1),
    })),
  ];

  const recentGames = recentGameIds
    .map((id) => games.find((item) => item.id === id))
    .filter(Boolean);

  const visibleGames = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text
      ? games.filter((item) => item.name.toLowerCase().includes(text))
      : games;
  }, [games, query]);

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

  function placeOf(key, index) {
    return places[key] ?? index + 1;
  }

  function save() {
    setSaveError(null);
    startSaving(async () => {
      const keys = participants.map((p) => p.key);
      const result = await saveSession({
        gameId,
        resultType,
        keys,
        winner,
        places: Object.fromEntries(
          participants.map((p, index) => [p.key, placeOf(p.key, index)]),
        ),
        scores,
      });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      router.push("/?saved=1");
    });
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

          {!query && recentGames.length > 0 && (
            <div className={styles.chips} aria-label="Recent games">
              <Chip tone="white">Recent</Chip>
              {recentGames.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.chipButton}
                  onClick={() => pickGame(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          {visibleGames.length === 0 && (
            <p className={styles.message}>No games match this search.</p>
          )}

          <ul className={styles.list}>
            {visibleGames.map((item) => {
              const type = findGameType(item.type);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.row} ${styles.rowButton} ${gameId === item.id ? styles.rowOn : ""}`}
                    onClick={() => pickGame(item.id)}
                  >
                    <div className={`${styles.tile} ${toneClass(type.tone)}`}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.rowText}>
                      <div className={styles.rowName}>{item.name}</div>
                      <div className={styles.chips}>
                        <Chip size="s">
                          <UsersIcon />
                          {formatPlayers(item)}
                        </Chip>
                        {item.typical_duration_min && (
                          <Chip size="s">
                            <ClockIcon />
                            {item.typical_duration_min} min
                          </Chip>
                        )}
                        {item.is_classic && (
                          <Chip size="s" tone="turquoise">
                            Classic
                          </Chip>
                        )}
                      </div>
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

          <div className={styles.strip}>
            {participants.map((p) => (
              <div key={p.key} className={styles.stripItem}>
                <Character size={62} color={p.color} />
                {p.name}
              </div>
            ))}
          </div>

          <ul className={styles.list}>
            <li className={styles.row}>
              <span className={styles.rowText}>
                <span className={styles.rowName}>{profile.nickname}</span>
              </span>
              <Chip size="s">You</Chip>
              <span className={`${styles.check} ${styles.checkOn}`} aria-hidden="true">
                &#10003;
              </span>
            </li>
            {guests.map((guest) => {
              const on = selected.includes(guest.id);
              return (
                <li key={guest.id}>
                  <button
                    type="button"
                    className={`${styles.row} ${styles.rowButton}`}
                    aria-pressed={on}
                    onClick={() => toggleGuest(guest.id)}
                  >
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
              <button
                type="submit"
                className={styles.small}
                disabled={addingGuest}
              >
                {addingGuest ? "Adding" : "Add"}
              </button>
            </div>
            {guestError && (
              <p role="alert" className={styles.message} style={{ marginTop: 8 }}>
                {guestError}
              </p>
            )}
          </form>

          <button
            type="button"
            className={styles.cta}
            disabled={participants.length < 2}
            onClick={() => setStep(3)}
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

          <ul className={styles.list}>
            {participants.map((p, index) => (
              <li key={p.key} className={styles.row}>
                {resultType === "ranking" && (
                  <span className={styles.rank} aria-hidden="true">
                    {placeOf(p.key, index)}
                  </span>
                )}
                <Character size={44} color={p.color} />
                <label className={styles.rowText} htmlFor={`field_${p.key}`}>
                  <span className={styles.rowName}>{p.name}</span>
                </label>

                {resultType === "winner" && (
                  <input
                    id={`field_${p.key}`}
                    className={styles.radio}
                    type="radio"
                    name="winner"
                    checked={winner === p.key}
                    onChange={() => setWinner(p.key)}
                  />
                )}
                {resultType === "ranking" && (
                  <select
                    id={`field_${p.key}`}
                    className={styles.control}
                    value={placeOf(p.key, index)}
                    onChange={(event) =>
                      setPlaces((current) => ({
                        ...current,
                        [p.key]: Number(event.target.value),
                      }))
                    }
                  >
                    {participants.map((_, place) => (
                      <option key={place} value={place + 1}>
                        {place + 1}
                      </option>
                    ))}
                  </select>
                )}
                {resultType === "points" && (
                  <input
                    id={`field_${p.key}`}
                    className={styles.control}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="0"
                    value={scores[p.key] ?? ""}
                    onChange={(event) =>
                      setScores((current) => ({
                        ...current,
                        [p.key]: event.target.value,
                      }))
                    }
                  />
                )}
              </li>
            ))}
          </ul>

          {saveError && (
            <p role="alert" className={styles.message}>
              {saveError}
            </p>
          )}

          <button
            type="button"
            className={styles.cta}
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving" : "Save session"}
          </button>
        </>
      )}
    </FlowShell>
  );
}
