"use client";

import { useRef, useState } from "react";
import styles from "./ActivityCalendar.module.css";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// "tue 14 oct" from "2026-10-14"
function dayName(key) {
  const date = new Date(`${key}T00:00:00Z`);
  return `${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

// Sessions per day as a grid of squares, a column per week. Takes the result
// of activityCalendar. Pointing at a day shows a small flag above it with the
// date and the sessions played.
export default function ActivityCalendar({ cells, months }) {
  const weeks = cells.length / 7;
  const total = cells.reduce((sum, cell) => sum + cell.count, 0);
  const wrap = useRef(null);
  const [flag, setFlag] = useState(null);

  function point(event) {
    const el = event.target;
    const index = el.dataset?.index;
    if (index === undefined) {
      setFlag(null);
      return;
    }
    const cell = cells[Number(index)];
    if (cell.level < 0) {
      setFlag(null);
      return;
    }
    setFlag({
      cell,
      x: el.offsetLeft + el.offsetWidth / 2,
      y: el.offsetTop,
      share: el.offsetLeft / wrap.current.offsetWidth,
    });
  }

  return (
    <div className={styles.wrap} ref={wrap} onPointerLeave={() => setFlag(null)}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${total} sessions in the last ${weeks} weeks`}
        onPointerOver={point}
      >
        {cells.map((cell, i) => (
          <span
            key={cell.date}
            data-index={i}
            className={`${styles.day} ${styles[`level${cell.level}`] ?? styles.future} ${
              flag?.cell === cell ? styles.dayOn : ""
            }`}
          />
        ))}
      </div>
      {flag && (
        <span
          className={styles.flag}
          style={{ left: flag.x, top: flag.y, "--shift": `${-flag.share * 100}%` }}
          aria-hidden="true"
        >
          <span className={styles.flagDate}>{dayName(flag.cell.date)}</span>
          <span className={styles.flagCount}>
            {flag.cell.count ? `${flag.cell.count} ${flag.cell.count === 1 ? "session" : "sessions"}` : "no games"}
          </span>
        </span>
      )}
      <div className={styles.months} style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden="true">
        {months.map((month) => (
          <span key={`${month.label}-${month.column}`} style={{ gridColumnStart: month.column + 1 }}>
            {month.label}
          </span>
        ))}
      </div>
    </div>
  );
}
