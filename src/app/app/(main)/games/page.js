import Link from "next/link";
import Die from "@/components/Die/Die";
import LoginGuard from "@/components/LoginGuard/LoginGuard";
import PageFrame, { PageTop } from "@/components/PageFrame/PageFrame";
import PlayingCard from "@/components/PlayingCard/PlayingCard";
import styles from "./welcome.module.css";

export const metadata = { title: "games" };

// The Games tab starts here: play a game inside the app, browse the catalog,
// or log a game played at the table.
export default function GamesWelcome() {
  return (
    <PageFrame>
      <LoginGuard />
      <PageTop title="Games" />

      <div className={`${styles.choices} stagger`}>
        <Link href="/app/games/play" className={`${styles.choice} ${styles.play}`}>
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

        <Link href="/app/games/track" className={`${styles.choice} ${styles.catalog}`}>
          <span className={styles.art} aria-hidden="true">
            <span className={styles.artCardA}>
              <PlayingCard card="KH" width={58} />
            </span>
            <span className={styles.artCardB}>
              <PlayingCard card="AS" width={58} />
            </span>
          </span>
          <span className={styles.choiceTitle}>Catalog</span>
          <span className={styles.choiceText}>
            Browse every game, from classics that need no box to your own, and
            look up how each one is played.
          </span>
          <span className={styles.go}>Browse games</span>
        </Link>

        <Link href="/app/log" className={`${styles.choice} ${styles.log}`}>
          <span className={styles.art} aria-hidden="true">
            <span className={styles.sheetLine} style={{ "--l": 0 }} />
            <span className={styles.sheetLine} style={{ "--l": 1 }} />
            <span className={styles.sheetLine} style={{ "--l": 2 }} />
          </span>
          <span className={styles.choiceTitle}>Log a session</span>
          <span className={styles.choiceText}>
            Played at the table? Save who played and who won in under a
            minute.
          </span>
          <span className={styles.go}>Log it</span>
        </Link>
      </div>
    </PageFrame>
  );
}
