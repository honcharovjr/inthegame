import styles from "./PlayingCard.module.css";

const SUITS = {
  S: { symbol: "♠︎", name: "spades", red: false },
  H: { symbol: "♥︎", name: "hearts", red: true },
  D: { symbol: "♦︎", name: "diamonds", red: true },
  C: { symbol: "♣︎", name: "clubs", red: false },
};

const RANK_NAMES = { A: "ace", J: "jack", Q: "queen", K: "king" };

// A playing card drawn with CSS. card: rank then suit, such as "AS" or
// "10H". faceDown shows the back; switching it flips the card over. dealt
// slides the card in when it appears, after delay seconds, so a deal lands
// one card after another.
export default function PlayingCard({ card, faceDown = false, width = 64, dealt = false, delay = 0, className = "" }) {
  const rank = card ? card.slice(0, -1) : "";
  const suit = SUITS[card?.slice(-1)] ?? SUITS.S;
  const label = faceDown || !card ? "face-down card" : `${RANK_NAMES[rank] ?? rank} of ${suit.name}`;

  return (
    <span
      className={`${styles.card} ${faceDown ? styles.down : ""} ${dealt ? styles.dealt : ""} ${className}`}
      style={{ "--w": `${width}px`, "--delay": `${delay}s` }}
      role="img"
      aria-label={label}
    >
      <span className={styles.inner}>
        <span className={`${styles.front} ${suit.red ? styles.red : ""}`} aria-hidden="true">
          <span className={styles.corner}>
            <span>{rank}</span>
            <span>{suit.symbol}</span>
          </span>
          <span className={styles.pip}>{suit.symbol}</span>
          <span className={`${styles.corner} ${styles.cornerEnd}`}>
            <span>{rank}</span>
            <span>{suit.symbol}</span>
          </span>
        </span>
        <span className={styles.back} aria-hidden="true" />
      </span>
    </span>
  );
}
