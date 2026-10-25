import Character from "@/components/Character/Character";
import styles from "./AuthShell.module.css";

// Frame for the sign-up, login and password screens: a loud colour poster
// with giant type, the character and the form at the bottom.
// tone: pink | turquoise | yellow
export default function AuthShell({ headline, tone = "pink", children }) {
  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <div className={styles.column}>
        <div className={styles.circle} aria-hidden="true" />
        <div className={styles.square} aria-hidden="true" />
        <div className={styles.character}>
          <Character size={150} color="#120a1a" />
        </div>
        <div className={styles.wordmark}>In the Game</div>
        <h1 className={styles.headline}>{headline}</h1>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
