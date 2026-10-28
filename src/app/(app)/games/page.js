import Link from "next/link";
import Die from "@/components/Die/Die";
import LoginGuard from "@/components/LoginGuard/LoginGuard";
import styles from "./welcome.module.css";

export const metadata = { title: "Games" };

const HEADLINE = "Play or track?";

// The Games tab starts here: play a game inside the app, or track one played
// at the table.
export default function GamesWelcome() {
  const words = HEADLINE.split(" ");

  return (
    <main className={styles.page}>
      <LoginGuard />
      <section className={styles.poster}>
        <div className={styles.shapes} aria-hidden="true">
          <span className={styles.circle} />
          <span className={styles.square} />
          <Die face={5} size={78} className={styles.floatDie} />
        </div>
        <p className={styles.kicker}>Games</p>
        <h1 className={styles.headline} aria-label={HEADLINE}>
          {words.map((word, index) => (
            <span key={index}>
              <span className={styles.word} style={{ "--w": index }} aria-hidden="true">
                {word}
              </span>
              {index < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
      </section>

      <div className={`${styles.choices} stagger`}>
        <Link href="/games/play" className={`${styles.choice} ${styles.play}`}>
          <span className={styles.art} aria-hidden="true">
            <Die face={6} size={54} className={styles.artDieA} />
            <Die face={3} size={46} className={styles.artDieB} />
            <Die face={1} size={38} className={styles.artDieC} />
          </span>
          <span className={styles.badge}>New</span>
          <span className={styles.choiceTitle}>Play</span>
          <span className={styles.choiceText}>
            Play right here. Pass the phone around, the app keeps the score and
            saves the result to everyone&apos;s history.
          </span>
          <span className={styles.go}>Pick a game</span>
        </Link>

        <Link href="/games/track" className={`${styles.choice} ${styles.track}`}>
          <span className={styles.art} aria-hidden="true">
            <span className={styles.sheetLine} style={{ "--l": 0 }} />
            <span className={styles.sheetLine} style={{ "--l": 1 }} />
            <span className={styles.sheetLine} style={{ "--l": 2 }} />
          </span>
          <span className={styles.choiceTitle}>Track</span>
          <span className={styles.choiceText}>
            Played at the table? Find the game in the catalog and log the result
            in under a minute.
          </span>
          <span className={styles.go}>Open the catalog</span>
        </Link>
      </div>
    </main>
  );
}
