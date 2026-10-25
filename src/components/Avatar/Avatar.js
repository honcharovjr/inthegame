import Character from "@/components/Character/Character";
import styles from "./Avatar.module.css";

// A player in a list or a header. A registered player is drawn as their
// character, so pass registered and the saved character (or null). A guest
// stays a coloured disc with the first letter.
export default function Avatar({
  name = "",
  size = 44,
  color = "#120a1a",
  registered = false,
  character = null,
  perks = false,
}) {
  if (registered) {
    return (
      <Character
        character={character}
        name={name}
        size={size}
        color={color}
        perks={perks}
      />
    );
  }

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
