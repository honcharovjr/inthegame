import Link from "next/link";
import BackButton from "@/components/BackButton/BackButton";
import Die from "@/components/Die/Die";
import LoginGuard from "@/components/LoginGuard/LoginGuard";
import { PLAYABLE_GAMES } from "@/lib/games/playable";
import styles from "./play.module.css";

export const metadata = { title: "play" };

// The games that can be played inside the app. Play mode has its own dark
// look, so it never feels like the tracking side.
export default function PlayPicker() {
  return (
    <main className={styles.page}>
      <LoginGuard />
      <div className={styles.top}>
        <BackButton to="/games" />
      </div>
      <h1 className={styles.headline}>
        Pick a<br />game
      </h1>

      <ul className={`${styles.list} stagger`}>
        {PLAYABLE_GAMES.map((game) => (
          <li key={game.slug}>
            <Link href={game.href} className={styles.card}>
              <span className={styles.dice} aria-hidden="true">
                <Die face={5} size={50} className={styles.dieA} />
                <Die face={2} size={42} className={styles.dieB} />
              </span>
              <span className={styles.name}>{game.name}</span>
              <span className={styles.blurb}>{game.blurb}</span>
              <span className={styles.meta}>
                <span className={styles.pill}>Solo</span>
                <span className={styles.pill}>With friends, up to {game.maxPlayers}</span>
              </span>
              <span className={styles.cta}>Play</span>
            </Link>
          </li>
        ))}
        <li className={styles.soon}>More games are on the way.</li>
      </ul>
    </main>
  );
}
