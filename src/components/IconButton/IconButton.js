import styles from "./IconButton.module.css";

// A round button with just an icon. The label is the tooltip on hover or focus
// and the name that screen readers read.
// tone: default | pink | white. tipAlign: center | end (for the right edge).
export default function IconButton({
  icon,
  label,
  tone = "default",
  tipAlign = "center",
  size = 44,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[tone]}`}
      style={{ width: size, height: size }}
      aria-label={label}
      data-tip={label}
      data-tip-align={tipAlign === "end" ? "end" : undefined}
      {...rest}
    >
      {icon}
    </button>
  );
}
