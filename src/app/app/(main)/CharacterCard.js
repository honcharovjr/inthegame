import Link from "next/link";
import { Suspense } from "react";
import Character from "@/components/Character/Character";
import GearIcon from "@/components/GearIcon/GearIcon";
import { LockIcon } from "@/components/icons";
import TradingCard, { ArtWindow } from "@/components/TradingCard/TradingCard";
import UserText from "@/components/UserText/UserText";
import { ACHIEVEMENTS } from "@/lib/achievements/catalog";
import { GEAR_SLOTS } from "@/lib/character/gear";
import { OUTFITS, RACES, nameStyle, resolveCharacter } from "@/lib/character/items";
import { nextUnlock } from "@/lib/character/next";
import { SESSION_STEPS, STREAK_STEPS, WIN_STEPS, milestone } from "@/lib/stats/milestones";
import styles from "./CharacterCard.module.css";

function Bar({ label, value, share, tone = "ink" }) {
  return (
    <div className={styles.bar}>
      <span className={styles.barLabel}>{label}</span>
      <span className={styles.track}>
        <span className={`${styles.fill} ${styles[`fill_${tone}`]}`} style={{ width: `${Math.round(share * 100)}%` }} />
      </span>
      <span className={styles.barValue}>{value}</span>
    </div>
  );
}

async function MedalsBar({ progress }) {
  const results = await progress;
  const medals = results ? results.filter((row) => row.earned).length : 0;
  return <Bar label="Medals" value={medals} share={medals / ACHIEVEMENTS.length} tone="pink" />;
}

async function NextUnlock({ progress }) {
  const results = await progress;
  const next = results && nextUnlock(results);
  if (!next) return null;
  return (
    <div className={styles.next}>
      <div className={styles.nextHead}>
        <span>Next: {next.item}</span>
        <span className={styles.barValue}>
          {next.current} / {next.target}
        </span>
      </div>
      {next.target <= 12 ? (
        <span className={styles.pips} aria-hidden="true">
          {Array.from({ length: next.target }, (_, i) => (
            <span key={i} className={i < next.current ? styles.pipOn : styles.pip} />
          ))}
        </span>
      ) : (
        <span className={styles.track}>
          <span className={`${styles.fill} ${styles.fill_ink}`} style={{ width: `${Math.round((next.current / next.target) * 100)}%` }} />
        </span>
      )}
      <span className={styles.nextBy}>{next.achievement}</span>
    </div>
  );
}

// The player's character on Home, the same card as on the profile: the
// figure, stat bars toward the next milestone, the gear slots and the next
// item to unlock. progress: a promise of the achievement progress (null if it
// failed).
export default function CharacterCard({ profile, played, wins, streak, progress }) {
  const look = resolveCharacter(profile.character);
  const race = RACES.find((item) => item.code === look.race)?.label;
  const outfit = OUTFITS.find((item) => item.code === look.outfit)?.label;
  const sessions = milestone(played, SESSION_STEPS);
  const winBar = milestone(wins, WIN_STEPS);
  const streakBar = milestone(streak, STREAK_STEPS);

  return (
    <TradingCard
      label="Your character"
      tilt
      className={styles.deck}
      name={
        <span className={`${styles.name} ${nameStyle(profile.character)}`}>
          <UserText>{profile.nickname}</UserText>
        </span>
      }
      kind={profile.character ? `${race} ${outfit}` : ""}
    >
      <div className={styles.layout}>
        <div className={styles.figureColumn}>
          <ArtWindow className={styles.figure}>
            <Character character={profile.character} name={profile.nickname} size="fill" view="full" perks />
          </ArtWindow>
          <Link href="/app/profile?mode=look" className={`${styles.customize} btn-primary`}>
            Customize
          </Link>
        </div>

        <div className={styles.body}>
          <div className={styles.bars}>
            <Bar label="Sessions" value={played} share={sessions.share} />
            <Bar label="Wins" value={wins} share={winBar.share} />
            <Suspense fallback={<Bar label="Medals" value="…" share={0} tone="pink" />}>
              <MedalsBar progress={progress} />
            </Suspense>
            <Bar label="Streak" value={streak} share={streakBar.share} tone="pink" />
          </div>

          <ul className={styles.gear} aria-label="Gear, coming soon">
            {GEAR_SLOTS.map((slot) => (
              <li key={slot.code} className={styles.slot} data-tip={`${slot.label}: soon`} data-tip-pos="below">
                <GearIcon slot={slot.code} size={24} />
                <span className={styles.slotLock} aria-hidden="true">
                  <LockIcon size={10} />
                </span>
              </li>
            ))}
          </ul>

          <Suspense fallback={null}>
            <NextUnlock progress={progress} />
          </Suspense>
        </div>
      </div>
    </TradingCard>
  );
}
