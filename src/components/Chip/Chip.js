import Link from "next/link";
import styles from "./Chip.module.css";

// A highlighted chip for any value that comes from data or settings.
// tone: default | primary | coral | lemon | sky | violet | dark
// Pass href to render a link, for example a filter.
export default function Chip({
  tone = "default",
  size = "m",
  href,
  children,
  ...rest
}) {
  const className = [styles.chip, styles[tone], size === "s" && styles.small]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}
