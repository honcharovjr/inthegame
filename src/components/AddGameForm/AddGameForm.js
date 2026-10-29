"use client";

import { useState, useTransition } from "react";
import { createGame } from "@/lib/games/actions";
import { gameEmoji, lastEmoji } from "@/lib/games/emoji";
import { GAME_TYPES } from "@/lib/games/types";
import UserText from "@/components/UserText/UserText";
import styles from "./AddGameForm.module.css";

// The form for a custom game. It floats over the page, so opening it never
// pushes anything down: put it inside a relatively positioned wrapper.
// A name that already exists is warned about once and can still be added.
// onAdded receives the saved game.
export default function AddGameForm({ existingNames, onAdded, onCancel }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState("board");
  // "" until the player types one. Then the default of the type is shown.
  const [emoji, setEmoji] = useState("");
  const [min, setMin] = useState("2");
  const [max, setMax] = useState("4");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState(null);
  const [warned, setWarned] = useState(false);

  const duplicate = existingNames.includes(name.trim().toLowerCase());

  function submit(event) {
    event.preventDefault();
    setError(null);
    if (duplicate && !warned) {
      setWarned(true);
      return;
    }
    startTransition(async () => {
      const result = await createGame({
        name,
        type,
        emoji,
        minPlayers: min,
        maxPlayers: max,
        duration,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onAdded(result.game);
    });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.title}>Add custom game</div>

      <div className={styles.nameRow}>
        <label className={styles.emojiField}>
          <span className={styles.label}>Emoji</span>
          <input
            className={styles.emojiInput}
            value={emoji || gameEmoji({ type })}
            onChange={(event) => setEmoji(lastEmoji(event.target.value))}
            onFocus={(event) => event.target.select()}
            inputMode="text"
            autoComplete="off"
            aria-label="Emoji of the game. Open your emoji keyboard to type your own."
            data-tip="Type any emoji"
            data-tip-pos="below"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input
            className={styles.input}
            value={name}
            maxLength={60}
            onChange={(event) => {
              setName(event.target.value);
              setWarned(false);
            }}
            placeholder="For example Fox's Hunt"
            required
            autoFocus
          />
        </label>
      </div>
      <p className={styles.hint}>
        Tap the emoji, then open your emoji keyboard. On Mac press Cmd Ctrl
        Space, on Windows press Win and the dot.
      </p>

      <div className={styles.types} role="group" aria-label="Game type">
        {GAME_TYPES.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`${styles.type} ${type === item.value ? styles.typeOn : ""}`}
            aria-pressed={type === item.value}
            onClick={() => setType(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.numbers}>
        <label className={styles.field}>
          <span className={styles.label}>Players from</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>to</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Minutes</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={1440}
            inputMode="numeric"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>

      {duplicate && (
        <p role="status" className={`${styles.message} ${styles.warning}`}>
          A game called <UserText>{name.trim()}</UserText> already exists.
          {warned ? " Press Add game again to add yours anyway." : ""}
        </p>
      )}
      {error && (
        <p role="alert" className={`${styles.message} ${styles.error}`}>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={`${styles.cancel} btn-secondary`} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={`${styles.add} btn-primary btn-tilt`} disabled={pending}>
          {pending ? "Adding" : warned ? "Add anyway" : "Add game"}
        </button>
      </div>
    </form>
  );
}
