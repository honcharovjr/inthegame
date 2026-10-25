import styles from "./Skeleton.module.css";

// A grey placeholder block that shimmers while real content loads.
// tone: "soft" for white screens, "light" for coloured screens.
export default function Skeleton({
  width = "100%",
  height = 16,
  radius = 12,
  tone = "soft",
  style,
}) {
  return (
    <div
      className={`${styles.skeleton} ${styles[tone]}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
