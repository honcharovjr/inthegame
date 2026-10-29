import Link from "next/link";
import Avatar from "@/components/Avatar/Avatar";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { LogoutIcon } from "@/components/icons";
import UserText, { GameName } from "@/components/UserText/UserText";
import { ACHIEVEMENTS } from "@/lib/achievements/catalog";
import { signOut } from "@/lib/auth/actions";
import { OUTFITS, RACES, nameStyle, resolveCharacter } from "@/lib/character/items";
import { deleteGuest } from "@/lib/profile/actions";
import { chartScale, sharedPaths } from "@/lib/stats/chart";
import NicknameForm from "./NicknameForm";
import Wardrobe from "./Wardrobe";
import styles from "./profile.module.css";

const LINE_COLORS = ["var(--color-turquoise-ink)", "var(--color-pink-deep)", "var(--color-violet-ink)"];
const BAR_TONES = ["yellow", "pink", "turquoise", "violet", "ink"];
// Achievements shown on the profile; CSS shows as many as fit in one row.
const MEDALS_SHOWN = 12;
// The size of the rating chart, in the units of its paths.
const CHART = { width: 400, height: 160, pad: 8 };

const DiceArt = (
  <svg width="38" height="38" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="5" fill="#fff" stroke="#120a1a" strokeWidth="2" />
    <circle cx="8.5" cy="8.5" r="1.6" fill="#120a1a" />
    <circle cx="12" cy="12" r="1.6" fill="#120a1a" />
    <circle cx="15.5" cy="15.5" r="1.6" fill="#120a1a" />
  </svg>
);
const CupArt = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#120a1a" strokeWidth="2" strokeLinecap="round">
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#ffc928" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8" />
  </svg>
);
const TargetArt = (
  <svg width="38" height="38" viewBox="0 0 24 24" stroke="#120a1a" strokeWidth="2">
    <circle cx="12" cy="12" r="9" fill="#ff4fa3" />
    <circle cx="12" cy="12" r="4" fill="#fff" />
  </svg>
);
const FlameArt = (
  <svg width="38" height="38" viewBox="0 0 24 24" stroke="#120a1a" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-7 1 2 2 3 3 3 0-3-1-5 0-7z" fill="#ff8a3d" />
  </svg>
);
const BoardArt = (
  <svg width="38" height="38" viewBox="0 0 24 24" stroke="#120a1a" strokeWidth="2" strokeLinejoin="round">
    <rect x="3" y="5" width="12" height="15" rx="2" fill="#2fd6d6" transform="rotate(-8 9 12)" />
    <rect x="9" y="4" width="12" height="15" rx="2" fill="#fff" transform="rotate(6 15 11)" />
  </svg>
);
const MedalArt = (
  <svg width="38" height="38" viewBox="0 0 24 24" stroke="#120a1a" strokeWidth="2" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" fill="#ffc928" />
    <path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1L12 14.6l-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="#fff" />
  </svg>
);

const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

// The profile below its title, from data read by the page. series: the
// rating steps of the games played most, [{ game, rating, values }].
// ratingOf: the current rating by game id. earned: achievement codes.
export default function ProfileView({ profile, startOnLook, totals, bestStreak, gameStats, statsError, ratingOf, earned, series, guests }) {
  const earnedSet = new Set(earned);
  const paths = sharedPaths(series, CHART.width, CHART.height, CHART.pad);
  const scale = chartScale(series, CHART.height, CHART.pad);
  // Where a value sits on the chart, as a share of its height
  const top = (value) => `${(scale.y(value) / CHART.height) * 100}%`;
  const look = resolveCharacter(profile.character);
  const kind = profile.character
    ? `${RACES.find((r) => r.code === look.race)?.label} ${OUTFITS.find((o) => o.code === look.outfit)?.label}`
    : "";
  const medals = [...ACHIEVEMENTS]
    .sort((a, b) => earnedSet.has(b.code) - earnedSet.has(a.code))
    .slice(0, MEDALS_SHOWN);
  const mostPlayed = gameStats.slice(0, 5);
  const maxPlayed = mostPlayed[0]?.played ?? 1;

  return (
    <>
      <Wardrobe
        name={profile.nickname}
        initial={profile.character}
        earned={earned}
        startOnLook={startOnLook}
        identity={<NicknameForm nickname={profile.nickname} nameClass={nameStyle(profile.character)} />}
        kind={kind}
        aside={
          <section className={styles.section} aria-label="Your numbers">
            <div className={styles.head}>
              <h2 className={styles.title}>Your numbers</h2>
            </div>
            <ul className={styles.numbers}>
              {[
                { label: "Sessions", value: totals.played, icon: DiceArt },
                { label: "Wins", value: totals.wins, icon: CupArt },
                { label: "Win rate", value: totals.winRate === null ? "–" : `${totals.winRate}%`, icon: TargetArt },
                { label: "Best streak", value: bestStreak, icon: FlameArt },
                { label: "Games", value: gameStats.length, icon: BoardArt },
                { label: "Medals", value: `${earned.length} / ${ACHIEVEMENTS.length}`, icon: MedalArt },
              ].map((item) => (
                <li key={item.label} className={styles.number}>
                  <span className={styles.numberIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={styles.numberText}>
                    <span className={styles.numberValue}>{item.value}</span>
                    <span className={styles.numberLabel}>{item.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        }
      />

      <section className={styles.section} aria-label="Achievements">
        <div className={styles.head}>
          <h2 className={styles.title}>Achievements</h2>
          <Link href="/profile/achievements" className={`${styles.moreButton} btn-secondary`}>
            Show all {ACHIEVEMENTS.length}
          </Link>
        </div>
        <ul className={styles.medals}>
          {medals.map((item) => {
            const done = earnedSet.has(item.code);
            return (
              <li key={item.code}>
                <Link
                  href="/profile/achievements"
                  className={`${styles.medal} ${done ? "" : styles.medalLocked}`}
                  data-tip={item.description}
                  data-tip-pos="below"
                >
                  <span className={`${styles.coin} ${done ? styles[`tier${item.tier}`] : ""}`} aria-hidden="true">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.6 6.7 19.5l1.1-6L3.4 9.3l6-.8z" />
                    </svg>
                  </span>
                  <span className={styles.medalName}>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {gameStats.length > 0 && (
        <div className={styles.stats}>
          {series.some((s) => s.values.length > 1) && (
            <section className={`${styles.section} ${styles.chart}`} aria-label="Rating by game">
              <div className={styles.head}>
                <h2 className={styles.title}>Rating by game</h2>
              </div>
              <ul className={styles.legend}>
                {series.map((s, i) => {
                  const change = s.values.length > 1 ? Math.round(s.values.at(-1) - s.values[0]) : 0;
                  return (
                    <li key={i} className={styles.legendItem}>
                      <span className={styles.swatch} style={{ background: LINE_COLORS[i] }} aria-hidden="true" />
                      <span className={styles.legendText}>
                        <span className={styles.legendGame}>
                          <GameName game={s.game} />
                        </span>
                        <span className={styles.legendNote}>
                          {s.values.length} {s.values.length === 1 ? "game" : "games"} rated
                        </span>
                      </span>
                      <span className={styles.legendValue}>{s.rating}</span>
                      {change !== 0 && (
                        <span className={change > 0 ? styles.up : styles.down}>{signed(change)}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className={styles.plot}>
                <span className={styles.axis} aria-hidden="true">
                  {[scale.max, (scale.max + scale.min) / 2, scale.min].map((value, i) => (
                    <span key={i} style={{ top: top(value) }}>
                      {Math.round(value)}
                    </span>
                  ))}
                </span>
                <div className={styles.canvas}>
                  <svg
                    className={styles.lines}
                    viewBox={`0 0 ${CHART.width} ${CHART.height}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Rating of your most played games over time"
                  >
                    {[CHART.pad, CHART.height / 2, CHART.height - CHART.pad].map((y) => (
                      <line key={y} x1="0" y1={y} x2={CHART.width} y2={y} className={styles.gridLine} />
                    ))}
                    {paths.map((d, i) => (
                      <path key={i} d={d} stroke={LINE_COLORS[i]} className={styles.line} />
                    ))}
                  </svg>
                  {series.map((s, i) =>
                    s.values.length ? (
                      <span
                        key={i}
                        className={styles.endDot}
                        style={{ top: top(s.values.at(-1)), background: LINE_COLORS[i] }}
                        aria-hidden="true"
                      />
                    ) : null,
                  )}
                </div>
                <span className={styles.xAxis} aria-hidden="true">
                  <span>first game</span>
                  <span>now</span>
                </span>
              </div>
            </section>
          )}

          <section className={`${styles.section} ${styles.share}`} aria-label="What you play">
            <div className={styles.head}>
              <h2 className={styles.title}>What you play</h2>
            </div>
            <ul className={styles.bars}>
              {mostPlayed.map((item, i) => (
                <li key={item.game.id} className={styles.barRow}>
                  <span className={styles.barName}>
                    <GameName game={item.game} />
                  </span>
                  <span className={styles.barTrack}>
                    <span
                      className={`${styles.barFill} ${styles[`bar_${BAR_TONES[i]}`]}`}
                      style={{ width: `${Math.round((item.played / maxPlayed) * 100)}%` }}
                    />
                  </span>
                  <span className={styles.barValue}>{item.played}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${styles.section} ${styles.tableBlock}`} aria-label="Your stats by game">
            <div className={styles.head}>
              <h2 className={styles.title}>Your stats by game</h2>
              <Link href="/history" className={`${styles.moreButton} btn-secondary`}>
                Show all sessions
              </Link>
            </div>
            {statsError && (
              <p role="alert" className={styles.empty}>
                Could not load your stats: {statsError.message}
              </p>
            )}
            <div className={styles.scroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Game</th>
                    <th scope="col">Sessions</th>
                    <th scope="col">Wins</th>
                    <th scope="col" className={styles.rateCol}>Win rate</th>
                    <th scope="col">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {gameStats.map((item) => (
                    <tr key={item.game.id}>
                      <td className={styles.gameCell}>
                        <GameName game={item.game} />
                      </td>
                      <td>{item.played}</td>
                      <td>{item.wins}</td>
                      <td>
                        <span className={styles.rate}>
                          <span className={styles.rateTrack}>
                            <span className={styles.rateFill} style={{ width: `${item.winRate ?? 0}%` }} />
                          </span>
                          <span className={styles.rateValue}>{item.winRate === null ? "–" : `${item.winRate}%`}</span>
                        </span>
                      </td>
                      <td>{ratingOf.get(item.game.id) ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <section className={styles.section} aria-label="Your guests">
        <div className={styles.head}>
          <h2 className={styles.title}>My guests</h2>
        </div>
        {guests.length ? (
          <ul className={styles.guests}>
            {guests.map((guest) => (
              <li key={guest.id} className={styles.guestRow}>
                <Avatar name={guest.name} size={38} color="#c9bcc8" />
                <span className={styles.guestName}>
                  <UserText>{guest.name}</UserText>
                </span>
                <ConfirmButton
                  title="Remove this guest?"
                  message={<><UserText>{guest.name}</UserText> will be removed from your guest list.</>}
                  confirmLabel="Remove guest"
                  ariaLabel={`Remove ${guest.name}`}
                  action={deleteGuest.bind(null, guest.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Guests you add while logging a session appear here.</p>
        )}
      </section>

      <ConfirmButton
        title="Log out?"
        message="You will need your email and password to come back."
        confirmLabel="Log out"
        icon={<LogoutIcon size={26} />}
        tone="pink"
        triggerLabel="Log out"
        triggerClassName={styles.signOut}
        action={signOut}
      />
    </>
  );
}
