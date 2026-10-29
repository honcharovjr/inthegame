import styles from "./TradingCard.module.css";

// The player as a collectible card on a small stack of cards: a yellow card
// with a framed edge, the name on top and the kind of the character on a
// ribbon in the fantasy font. name: a node, kind: text or empty.
export default function TradingCard({ label, name, kind, tilt = false, className = "", children }) {
  return (
    <section className={`${styles.deck} ${tilt ? styles.tilt : ""} ${className}`} aria-label={label}>
      <div className={styles.card}>
        <div className={styles.plate}>
          {name}
          {kind && <span className={styles.kind}>{kind}</span>}
        </div>
        {children}
      </div>
    </section>
  );
}

// The window the character stands in, with rings of light behind it.
export function ArtWindow({ className = "", children }) {
  return <div className={`${styles.art} ${className}`}>{children}</div>;
}
