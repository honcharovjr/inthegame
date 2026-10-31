import Link from "next/link";
import ActivityCalendar from "@/components/ActivityCalendar/ActivityCalendar";
import Avatar from "@/components/Avatar/Avatar";
import Flames from "@/components/Flames/Flames";
import GameInvites from "@/components/GameInvites/GameInvites";
import { InfoIcon } from "@/components/icons";
import Toast from "@/components/Toast/Toast";
import UserText, { GameName } from "@/components/UserText/UserText";
import { STREAK_STEPS, milestone } from "@/lib/stats/milestones";
import CharacterCard from "./CharacterCard";
import styles from "./page.module.css";

const RIVAL_COLORS = ["turquoise", "pink", "white"];
// Games listed under the average rating
const RATING_GAMES = 3;

// Home below its title, from data read by the page. rating: the overall
// rating, how many games count toward it, and the rows behind it, played
// most first. progress: a
// promise of the achievement progress, which streams in on its own.
export default function HomeView({ saved, profile, totals, streak, calendar, rating, timeline, rivals, progress }) {
  return (
    <>
      {saved && <Toast message="Session saved. Nice game." tone="success" dismissTo="/" />}

      <GameInvites profileId={profile.id} />

      <div className={styles.grid}>
        <CharacterCard profile={profile} played={totals.played} wins={totals.wins} streak={streak} progress={progress} />

        <div className={styles.side}>
          <div className={styles.pair}>
            <section className={styles.section} aria-label="Rating">
              <div className={styles.head}>
                <h2 className={styles.title}>Rating</h2>
                {rating.counted > 0 ? (
                  <span className={styles.note}>
                    across {rating.counted} {rating.counted === 1 ? "game" : "games"}
                  </span>
                ) : (
                  rating.games.length > 0 && <span className={styles.note}>3 rated sessions in a game to start</span>
                )}
              </div>
              <span className={styles.big}>
                <span className={styles.marker}>{rating.average ?? "–"}</span>
              </span>
              {rating.games.length > 1 && (
                <ul className={styles.ratings}>
                  {rating.games.slice(0, RATING_GAMES).map((row) => (
                    <li key={row.game_id}>
                      <span className={styles.ratingGame}>
                        <GameName game={row.games} />
                      </span>
                      <span className={styles.ratingValue}>{Math.round(Number(row.rating))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.section} aria-label="Win streak">
              <div className={styles.head}>
                <h2 className={styles.title}>
                  On a roll
                  <span
                    className={styles.info}
                    tabIndex={0}
                    role="img"
                    aria-label="Wins in a row in sessions with other players. Solo sessions don't break it."
                    data-tip="Wins in a row in sessions with other players. Solo sessions don't break it."
                    data-tip-pos="below"
                  >
                    <InfoIcon size={18} />
                  </span>
                </h2>
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
            {timeline.length > 0 && (
              <Link href="/history" className={`${styles.moreButton} btn-secondary`}>
                Show all sessions
              </Link>
            )}
          </div>
          {timeline.length ? (
            <ol className={styles.timeline}>
              {timeline.map((item) => (
                <li key={item.id}>
                  <Link href={`/history?session=${item.id}`} className={styles.step}>
                    <span className={`${styles.dot} ${styles[`dot_${item.tone}`]}`} aria-hidden="true" />
                    <span className={styles.stepText}>
                      <span className={styles.stepGame}>
                        <GameName game={item.game} />
                      </span>
                      <span className={styles.note}>{item.date}</span>
                    </span>
                    <span className={`${styles.place} ${styles[`place_${item.tone}`]}`}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <Link href="/log" className={`${styles.moreButton} btn-secondary`}>
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
      </div>
    </>
  );
}
