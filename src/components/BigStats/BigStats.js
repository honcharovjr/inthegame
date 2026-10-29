import styles from "./BigStats.module.css";

// A few numbers shown large, each with a highlighter stroke and a label, such
// as wins, sessions and win rate. items: [{ label, value, tone }], tone is
// "yellow", "pink" or "turquoise".
export default function BigStats({ items }) {
  return (
    <dl className={styles.stats}>
      {items.map((item) => (
        <div key={item.label} className={styles.stat}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>
            <span className={`${styles.mark} ${styles[item.tone ?? "yellow"]}`}>{item.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
