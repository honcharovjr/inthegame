import BackButton from "@/components/BackButton/BackButton";
import AuthShapes from "@/components/AuthShapes/AuthShapes";
import styles from "./AuthShell.module.css";

// Frame for the sign-up, login and password screens: a loud colour poster
// with giant type, bold shapes and the form at the bottom.
// tone: pink | turquoise | yellow
// backTo: shows a back button that goes to this address. Without it there is
// no back button.
export default function AuthShell({ headline, tone = "pink", backTo, children }) {
  const words = headline.split(" ");

  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <div className={styles.column}>
        <AuthShapes />
        <div className={styles.wordmark}>
          {backTo && <BackButton to={backTo} />}
          In the Game
        </div>
        <h1 className={styles.headline} aria-label={headline}>
          {words.map((word, index) => (
            <span key={index} className={styles.word} style={{ "--w": index }} aria-hidden="true">
              {word}
              {index < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
