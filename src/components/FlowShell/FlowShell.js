import Link from "next/link";
import styles from "./FlowShell.module.css";

// Frame for the log flow: a loud colour screen with a back button, step
// counter, progress segments and a giant headline.
// tone: turquoise | yellow | pink
export default function FlowShell({
  step,
  total = 3,
  tone,
  backHref,
  headline,
  children,
}) {
  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <div className={styles.column}>
        <div className={styles.top}>
          <Link href={backHref} className={styles.back} aria-label="Back">
            &#8249;
          </Link>
          <span className={styles.step}>
            {step} of {total}
          </span>
          <span className={styles.spacer} />
        </div>
        <div className={styles.segments} aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={index < step ? styles.segmentOn : styles.segment}
            />
          ))}
        </div>
        <h1 className={styles.headline}>{headline}</h1>
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
}
