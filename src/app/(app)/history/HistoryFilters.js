"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import GameSelect from "@/components/GameSelect/GameSelect";
import styles from "./history.module.css";

const RESULTS = [
  { value: "", label: "All" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Not won" },
];

// Filters of the history. They live in the address, so a filtered view can be
// reloaded or shared, and every change starts again from page one.
export default function HistoryFilters({ games, filters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(changes) {
    const next = { ...filters, ...changes };
    const query = new URLSearchParams();
    if (next.game) query.set("game", next.game);
    if (next.from) query.set("from", next.from);
    if (next.to) query.set("to", next.to);
    if (next.result) query.set("result", next.result);
    const text = query.toString();
    startTransition(() => {
      router.push(text ? `/history?${text}` : "/history");
    });
  }

  const active = Boolean(
    filters.game || filters.from || filters.to || filters.result,
  );

  return (
    <section
      className={`${styles.filters} ${pending ? styles.filtersBusy : ""}`}
      aria-label="Filters"
    >
      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Game</span>
          <GameSelect
            games={games}
            value={filters.game}
            onChange={(game) => update({ game })}
          />
        </div>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>From</span>
          <input
            className={styles.date}
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => update({ from: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>To</span>
          <input
            className={styles.date}
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => update({ to: event.target.value })}
          />
        </label>
      </div>

      <div className={styles.resultRow}>
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
        {active && (
          <button
            type="button"
            className={styles.clear}
            onClick={() =>
              update({ game: "", from: "", to: "", result: "" })
            }
          >
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}
