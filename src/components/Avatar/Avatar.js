import styles from "./Avatar.module.css";

// A placeholder for a player: a coloured disc with their first letter.
export default function Avatar({ name = "", size = 44, color = "#120a1a" }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.42),
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
