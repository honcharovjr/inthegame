import Link from "next/link";
import styles from "./FlowShell.module.css";

// Frame for the log flow: a loud colour screen with a back button, step
// counter, progress segments and a giant headline.
// tone: turquoise | yellow | pink
// Give backHref for a link or onBack for a button.
export default function FlowShell({
  step,
  total = 3,
  tone,
  backHref,
  onBack,
  headline,
  children,
}) {
  const chevron = (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );

  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <div className={styles.column}>
        <div className={styles.top}>
          {onBack ? (
            <button
              type="button"
              className={styles.back}
              onClick={onBack}
              aria-label="Back"
            >
              {chevron}
            </button>
          ) : (
            <Link href={backHref} className={styles.back} aria-label="Back">
              {chevron}
            </Link>
          )}
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
        <div key={step} className={styles.content}>
          {children}
        </div>
      </div>
    </main>
  );
}
