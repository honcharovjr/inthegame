"use client";

import { useFilterLoading } from "@/components/FilterLoading/FilterLoading";
import GameSelect from "@/components/GameSelect/GameSelect";
import IconButton from "@/components/IconButton/IconButton";
import { ResetIcon } from "@/components/icons";
import styles from "./history.module.css";

const RESULTS = [
  { value: "", label: "All" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Not won" },
];

const RATINGS = [
  { value: "", label: "All" },
  { value: "rated", label: "Rated" },
  { value: "unrated", label: "Unrated" },
];

// Filters of the history. They live in the address, so a filtered view can be
// reloaded or shared, and every change starts again from page one.
export default function HistoryFilters({ games, filters }) {
  const { pending, go } = useFilterLoading();

  function update(changes) {
    const next = { ...filters, ...changes };
    const query = new URLSearchParams();
    if (next.game) query.set("game", next.game);
    if (next.from) query.set("from", next.from);
    if (next.to) query.set("to", next.to);
    if (next.result) query.set("result", next.result);
    if (next.rating) query.set("rating", next.rating);
    const text = query.toString();
    go(text ? `/history?${text}` : "/history");
  }

  const active = Boolean(
    filters.game || filters.from || filters.to || filters.result || filters.rating,
  );

  return (
    <section
      className={`${styles.filters} ${pending ? styles.filtersBusy : ""}`}
      aria-label="Filters"
    >
      <div className={`${styles.field} ${styles.fieldGame}`}>
        <span className={styles.fieldLabel}>Game</span>
        <GameSelect
          games={games}
          value={filters.game}
          onChange={(game) => update({ game })}
        />
      </div>
      <label className={`${styles.field} ${styles.fieldDate}`}>
        <span className={styles.fieldLabel}>From</span>
        <input
          className={styles.date}
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => update({ from: event.target.value })}
        />
      </label>
      <label className={`${styles.field} ${styles.fieldDate}`}>
        <span className={styles.fieldLabel}>To</span>
        <input
          className={styles.date}
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => update({ to: event.target.value })}
        />
      </label>
      <div className={`${styles.field} ${styles.fieldResult}`}>
        <span className={styles.fieldLabel}>Result</span>
        <div className={styles.switch} role="group" aria-label="Result">
          {RESULTS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.switchButton} ${filters.result === option.value ? styles.switchOn : ""}`}
              aria-pressed={filters.result === option.value}
              onClick={() => update({ result: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`${styles.field} ${styles.fieldResult}`}>
        <span className={styles.fieldLabel}>Rating</span>
        <div className={styles.switch} role="group" aria-label="Rating">
          {RATINGS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.switchButton} ${filters.rating === option.value ? styles.switchOn : ""}`}
              aria-pressed={filters.rating === option.value}
              onClick={() => update({ rating: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel} aria-hidden="true">
          &nbsp;
        </span>
        <IconButton
          size={46}
          tipAlign="end"
          label="Reset filters"
          icon={<ResetIcon size={20} />}
          disabled={!active}
          onClick={() => update({ game: "", from: "", to: "", result: "", rating: "" })}
        />
      </div>
    </section>
  );
}
