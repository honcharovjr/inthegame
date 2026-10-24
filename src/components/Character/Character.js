import styles from "./Character.module.css";

// The player's character, a meeple shape. Colour and size are settings.
// Accessories for customization are layered on top in a later phase.
export default function Character({ size = 160, color = "#2fd6d6" }) {
  return (
    <svg
      className={styles.character}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Your character"
      style={{
        filter: `drop-shadow(0 ${Math.round(size / 24)}px ${Math.round(size / 10)}px ${color}66)`,
      }}
    >
      <path
        d="M50 34C44 34 40 37 36 40L14 48C8 50 8 58 14 59L30 60C32 66 26 76 22 86C20 92 24 96 30 96L44 96C47 96 49 94 50 92C51 94 53 96 56 96L70 96C76 96 80 92 78 86C74 76 68 66 70 60L86 59C92 58 92 50 86 48L64 40C60 37 56 34 50 34Z"
        fill={color}
      />
      <circle cx="50" cy="21" r="14" fill={color} />
      <circle cx="45" cy="20" r="2" className={styles.face} />
      <circle cx="55" cy="20" r="2" className={styles.face} />
      <path
        d="M45 26q5 4 10 0"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={styles.mouth}
      />
    </svg>
  );
}
