import Link from "next/link";
import Die from "@/components/Die/Die";
import LoginGuard from "@/components/LoginGuard/LoginGuard";
import PageFrame, { AsideTitle, PageTop } from "@/components/PageFrame/PageFrame";
import Poster from "@/components/Poster/Poster";
import styles from "./welcome.module.css";

export const metadata = { title: "games" };

const HEADLINE = "Play or track?";

// The Games tab starts here: play a game inside the app, or track one played
// at the table.
export default function GamesWelcome() {
  return (
    <PageFrame>
      <LoginGuard />
      <PageTop
        label="Quick start"
        poster={<Poster kicker="Games" headline={HEADLINE} />}
        aside={
          <>
            <AsideTitle>Quick start</AsideTitle>
            <Link href="/play/yahtzee" className={`${styles.quick} ${styles.quickPlay} btn-primary btn-tilt`}>
              <Die face={6} size={34} className={styles.quickDie} />
              <span>Play yahtzee</span>
            </Link>
            <Link href="/log" className={`${styles.quick} btn-secondary btn-tilt`}>
              <span className={styles.quickPlus} aria-hidden="true">
                +
              </span>
              <span>Log a session</span>
            </Link>
          </>
        }
      />

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
            Play right here, solo or with friends on one phone. The app rolls
            the dice and keeps the score.
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
    </PageFrame>
  );
}
