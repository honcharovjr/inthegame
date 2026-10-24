import Character from "@/components/Character/Character";
import styles from "./AuthShell.module.css";

// Frame for the sign-up, login and password screens:
// character in an arch window, wordmark, headline, then the form.
export default function AuthShell({ headline, children }) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <div className={styles.top}>
          <div className={styles.arch}>
            <div className={styles.halo} />
            <div className={styles.character}>
              <Character size={98} />
            </div>
          </div>
          <div className={styles.wordmark}>In the Game</div>
        </div>
        <h1 className={styles.headline}>{headline}</h1>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
