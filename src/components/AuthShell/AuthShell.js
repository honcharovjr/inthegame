import BackButton from "@/components/BackButton/BackButton";
import styles from "./AuthShell.module.css";

// Frame for the sign-up, login and password screens: a loud colour poster
// with giant type, bold shapes and the form at the bottom.
// tone: pink | turquoise | yellow
// backFallback: where the back button goes when there is nothing to go back to
export default function AuthShell({
  headline,
  tone = "pink",
  backFallback = "/login",
  children,
}) {
  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <div className={styles.column}>
        <div className={styles.circle} aria-hidden="true" />
        <div className={styles.square} aria-hidden="true" />
        <div className={styles.block} aria-hidden="true" />
        <div className={styles.wordmark}>
          <BackButton fallback={backFallback} />
          In the Game
        </div>
        <h1 className={styles.headline}>{headline}</h1>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
