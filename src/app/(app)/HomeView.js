import Link from "next/link";
import ActivityCalendar from "@/components/ActivityCalendar/ActivityCalendar";
import Avatar from "@/components/Avatar/Avatar";
import Die from "@/components/Die/Die";
import Flames from "@/components/Flames/Flames";
import PlayingCard from "@/components/PlayingCard/PlayingCard";
import Toast from "@/components/Toast/Toast";
import UserText, { GameName } from "@/components/UserText/UserText";
import { PLAYABLE_GAMES } from "@/lib/games/playable";
import { linePath } from "@/lib/stats/chart";
import { STREAK_STEPS, milestone } from "@/lib/stats/milestones";
import CharacterCard from "./CharacterCard";
import styles from "./page.module.css";

const RIVAL_COLORS = ["turquoise", "pink", "white"];

// Home below its title, from data read by the page. top: the rating row of
// the game played most, trend: its last ratings. progress: a promise of the
// achievement progress, which streams in on its own.
export default function HomeView({ saved, profile, totals, streak, calendar, top, trend, timeline, rivals, progress }) {
  return (
    <>
      {saved && <Toast message="Session saved. Nice game." tone="success" dismissTo="/" />}

      <div className={styles.grid}>
        <CharacterCard profile={profile} played={totals.played} wins={totals.wins} streak={streak} progress={progress} />

        <div className={styles.side}>
          <div className={styles.pair}>
            <section className={styles.section} aria-label="Rating">
              <div className={styles.head}>
                <h2 className={styles.title}>Rating</h2>
                {top && (
                  <span className={styles.note}>
                    <GameName game={top.games} />
                  </span>
                )}
              </div>
              <span className={styles.big}>
                <span className={styles.marker}>{top ? Math.round(Number(top.rating)) : "–"}</span>
              </span>
              {trend.length > 1 && (
                <svg className={styles.spark} viewBox="0 0 240 48" preserveAspectRatio="none" aria-hidden="true">
                  <path d={linePath(trend, 240, 48)} vectorEffect="non-scaling-stroke" />
                </svg>
              )}
            </section>

            <section className={styles.section} aria-label="Win streak">
              <div className={styles.head}>
                <h2 className={styles.title}>On a roll</h2>
              </div>
              <span className={styles.big}>{streak}</span>
              <Flames value={streak} goal={milestone(streak, STREAK_STEPS).target} />
            </section>
          </div>

          <section className={styles.section} aria-label="Activity">
            <div className={styles.head}>
              <h2 className={styles.title}>Activity</h2>
            </div>
            <ActivityCalendar cells={calendar.cells} months={calendar.months} />
          </section>
        </div>

        <section className={`${styles.section} ${styles.lastBlock}`} aria-label="Last sessions">
          <div className={styles.head}>
            <h2 className={styles.title}>Last sessions</h2>
            <Link href="/history" className={styles.more}>
              History
            </Link>
          </div>
          {timeline.length ? (
            <ol className={styles.timeline}>
              {timeline.map((item) => (
                <li key={item.id} className={styles.step}>
                  <span className={`${styles.dot} ${styles[`dot_${item.tone}`]}`} aria-hidden="true" />
                  <span className={styles.stepText}>
                    <span className={styles.stepGame}>
                      <GameName game={item.game} />
                    </span>
                    <span className={styles.note}>{item.date}</span>
                  </span>
                  <span className={`${styles.place} ${styles[`place_${item.tone}`]}`}>{item.label}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Link href="/log" className={styles.more}>
              Log your first session
            </Link>
          )}
        </section>

        {rivals.length > 0 && (
          <section className={`${styles.section} ${styles.rivalsBlock}`} aria-label="Rivals">
            <div className={styles.head}>
              <h2 className={styles.title}>Rivals</h2>
            </div>
            <ul className={styles.cards}>
              {rivals.map((rival, i) => (
                <li key={rival.key} className={`${styles.rival} ${styles[`rival_${RIVAL_COLORS[i]}`]}`}>
                  <Avatar
                    name={rival.name}
                    size={52}
                    color="#e6e0ff"
                    registered={rival.registered}
                    character={rival.character}
                  />
                  <span className={styles.rivalText}>
                    <span className={styles.rivalName}>
                      <UserText>{rival.name}</UserText>
                    </span>
                    <span className={styles.record}>
                      {rival.wins}–{rival.losses}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.play} aria-label="Play now">
          <h2 className={styles.playTitle}>Play now</h2>
          {PLAYABLE_GAMES.map((game) => (
            <Link key={game.slug} href={game.href} className={styles.playRow}>
              <span className={styles.playArt} aria-hidden="true">
                {game.slug === "blackjack" ? <PlayingCard card="AS" width={30} /> : <Die face={5} size={30} />}
              </span>
              <span className="keep-case">{game.name}</span>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
