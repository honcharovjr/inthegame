"use client";

import { useActionState, useState } from "react";
import Character from "@/components/Character/Character";
import { saveSession } from "@/lib/sessions/actions";
import styles from "../flow.module.css";

const TYPES = [
  { value: "winner", label: "Winner" },
  { value: "ranking", label: "Places" },
  { value: "points", label: "Points" },
];

// The result of one session: who won, the places, or points per player.
// participants: [{ key, name, color }]. The key is "me" or a guest id.
export default function ResultForm({ gameId, participants }) {
  const [state, formAction, pending] = useActionState(saveSession, {
    error: null,
  });
  const [type, setType] = useState("ranking");

  return (
    <form action={formAction} className={styles.content} style={{ flex: 1 }}>
      <input type="hidden" name="game" value={gameId} />
      <input type="hidden" name="result_type" value={type} />
      {participants.map((p) => (
        <input key={p.key} type="hidden" name="participant" value={p.key} />
      ))}

      <div className={styles.switch} role="group" aria-label="How to record the result">
        {TYPES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.switchButton} ${type === option.value ? styles.switchButtonOn : ""}`}
            aria-pressed={type === option.value}
            onClick={() => setType(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className={styles.list}>
        {participants.map((p, index) => (
          <li key={p.key} className={styles.row}>
            {type === "ranking" && (
              <span className={styles.rank} aria-hidden="true">
                {index + 1}
              </span>
            )}
            <Character size={44} color={p.color} />
            <label className={styles.rowText} htmlFor={`field_${p.key}`}>
              <span className={styles.rowName}>{p.name}</span>
            </label>

            {type === "winner" && (
              <input
                id={`field_${p.key}`}
                className={styles.radio}
                type="radio"
                name="winner"
                value={p.key}
                defaultChecked={index === 0}
              />
            )}
            {type === "ranking" && (
              <select
                id={`field_${p.key}`}
                className={styles.control}
                name={`place_${p.key}`}
                defaultValue={index + 1}
                aria-label={`Place for ${p.name}`}
              >
                {participants.map((_, place) => (
                  <option key={place} value={place + 1}>
                    {place + 1}
                  </option>
                ))}
              </select>
            )}
            {type === "points" && (
              <input
                id={`field_${p.key}`}
                className={styles.control}
                type="number"
                inputMode="decimal"
                step="any"
                name={`score_${p.key}`}
                placeholder="0"
                aria-label={`Points for ${p.name}`}
                required
              />
            )}
          </li>
        ))}
      </ul>

      {state?.error && (
        <p role="alert" className={styles.message}>
          {state.error}
        </p>
      )}

      <button type="submit" className={styles.cta} disabled={pending}>
        {pending ? "Saving" : "Save session"}
      </button>
    </form>
  );
}
