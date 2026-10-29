import { TrophyIcon } from "@/components/icons";
import styles from "./ResultBadge.module.css";

// How a session went for the player, drawn instead of written:
// a trophy for a win, the place number for anything else.
// label is the words, such as "Won" or "2nd". They show as a tooltip.
export default function ResultBadge({ place, players, label }) {
  if (players < 2) return <span className={styles.solo}>{label}</span>;

  const won = place === 1;
  const tone = won ? "win" : place === 2 ? "second" : place === 3 ? "third" : "rest";
  const words = won ? "Won" : `${label} of ${players}`;

  return (
    <span
      className={`${styles.badge} ${styles[tone]}`}
      data-tip={words}
      data-tip-align="end"
      tabIndex={0}
      role="img"
      aria-label={words}
    >
      {won ? <TrophyIcon size={22} /> : place}
    </span>
  );
}
