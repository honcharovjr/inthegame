import styles from "./Flames.module.css";

const FLAME = "M12 1c2 6 9 8 9 16a9 9 0 0 1-18 0c0-5 4-7 4-12 3 2 5 5 5 8";

// A streak as a row of flames: lit ones for the wins in a row, grey ones up to
// the next goal.
export default function Flames({ value, goal, size = 40 }) {
  const count = Math.max(goal, value);
  return (
    <div className={styles.row} role="img" aria-label={`${value} wins in a row`}>
      {Array.from({ length: count }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={Math.round(size * 1.17)}
          viewBox="0 0 24 28"
          className={i < value ? styles.lit : styles.out}
          style={{ animationDelay: `${i * 0.25}s` }}
          aria-hidden="true"
        >
          <path d={FLAME} />
        </svg>
      ))}
    </div>
  );
}
