import styles from "./ActivityCalendar.module.css";

// Sessions per day as a grid of squares, a column per week. Takes the result
// of activityCalendar.
export default function ActivityCalendar({ cells, months }) {
  const weeks = cells.length / 7;
  const total = cells.reduce((sum, cell) => sum + cell.count, 0);
  return (
    <div className={styles.wrap}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${total} sessions in the last ${weeks} weeks`}
      >
        {cells.map((cell) => (
          <span
            key={cell.date}
            className={`${styles.day} ${styles[`level${cell.level}`] ?? styles.future}`}
            title={cell.level >= 0 ? `${cell.date}: ${cell.count}` : undefined}
          />
        ))}
      </div>
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
