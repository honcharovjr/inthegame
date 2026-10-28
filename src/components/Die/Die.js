import styles from "./Die.module.css";

// Pip positions on a 3 by 3 grid, counted from the top left.
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// A die face drawn with CSS. size in pixels. blank hides the pips.
export default function Die({ face = 1, size = 56, blank = false, className = "", style }) {
  const pips = blank ? [] : PIPS[face] ?? [];
  return (
    <span
      className={`${styles.die} ${className}`}
      style={{ "--size": `${size}px`, ...style }}
      aria-hidden="true"
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={pips.includes(index) ? styles.pip : styles.slot} />
      ))}
    </span>
  );
}
