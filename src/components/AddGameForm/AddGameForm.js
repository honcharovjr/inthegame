"use client";

import { useState, useTransition } from "react";
import { createGame } from "@/lib/games/actions";
import { GAME_EMOJIS } from "@/lib/games/emoji";
import { GAME_TYPES } from "@/lib/games/types";
import styles from "./AddGameForm.module.css";

// The form for a custom game. A name that already exists is warned about once
// and can still be added. onAdded receives the saved game.
export default function AddGameForm({ existingNames, onAdded, onCancel }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState("board");
  const [emoji, setEmoji] = useState(GAME_EMOJIS[0]);
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
      <div className={styles.title}>Add your own game</div>

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

      <div className={styles.field}>
        <span className={styles.label}>Emoji</span>
        <div className={styles.emojis} role="group" aria-label="Game emoji">
          {GAME_EMOJIS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.emoji} ${emoji === item ? styles.emojiOn : ""}`}
              aria-pressed={emoji === item}
              onClick={() => setEmoji(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Type</span>
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
          A game called {name.trim()} already exists.
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
        <button type="submit" className={`${styles.add} btn-primary`} disabled={pending}>
          {pending ? "Adding" : warned ? "Add anyway" : "Add game"}
        </button>
      </div>
    </form>
  );
}
