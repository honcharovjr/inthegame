import styles from "./MetaLine.module.css";

// Facts about a row in one quiet line, such as the date and the players,
// split by dots. Empty items are left out.
export default function MetaLine({ items, className = "" }) {
  return (
    <span className={`${styles.meta} ${className}`}>
      {items.filter(Boolean).map((item, i) => (
        <span key={i} className={styles.item}>
          {item}
        </span>
      ))}
    </span>
  );
}
