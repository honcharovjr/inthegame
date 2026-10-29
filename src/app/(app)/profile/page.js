import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import PlayingSince from "@/components/PlayingSince/PlayingSince";
import AllTimeStats from "@/components/AllTimeStats/AllTimeStats";
import PageFrame, { PageTop } from "@/components/PageFrame/PageFrame";
import Poster from "@/components/Poster/Poster";
import { LogoutIcon, PenIcon } from "@/components/icons";
import Skeleton from "@/components/Skeleton/Skeleton";
import { nameStyle } from "@/lib/character/items";
import { signOut } from "@/lib/auth/actions";
import { getProfile } from "@/lib/auth/session";
import { deleteGuest } from "@/lib/profile/actions";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
import { playerStats } from "@/lib/stats/player";
import { loadResults } from "@/lib/stats/results";
import { createClient } from "@/lib/supabase/server";
import UserText, { GameName } from "@/components/UserText/UserText";
import NicknameForm from "./NicknameForm";
import ProfileHero from "./ProfileHero";
import styles from "./profile.module.css";

export const metadata = { title: "profile" };

export default function ProfilePage() {
  return (
    <PageFrame>
      <PageTop
        label="All time"
        poster={<Poster tone="ink" kicker="Profile" headline="your player card." face={1} />}
        aside={(
          <AllTimeStats>
            <div className={styles.asideFoot}>
              <Chip size="s" href="/profile/achievements">
                Achievements
              </Chip>
              <Chip size="s" href="/history">
                All sessions
              </Chip>
            </div>
          </AllTimeStats>
        )}
      />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </PageFrame>
  );
}

function ProfileSkeleton() {
  return (
    <div className={styles.body}>
      <Skeleton height={120} radius={22} />
      <Skeleton height={150} radius={22} delay={80} />
    </div>
  );
}

// Reads the session and the database, so it streams in behind Suspense.
async function ProfileContent() {
  const { profile } = await getProfile();
  const supabase = await createClient();
  const [{ data: guests }, results] = await Promise.all([
    supabase.from("guests").select("id, name").eq("owner_id", profile?.id).order("created_at"),
    profile ? loadResults(supabase, profile.id, { withGames: true }) : { rows: [] },
  ]);
  const { games: gameStats } = playerStats(results.rows);

  const identity = (
    <>
      <NicknameForm nickname={profile?.nickname ?? ""} nameClass={nameStyle(profile?.character)} />
      {profile?.created_at && <PlayingSince date={profile.created_at} />}
      <Link href="/profile/customize" className={`${styles.customize} btn-secondary btn-tilt`}>
        <PenIcon size={16} />
        Customize character
      </Link>
    </>
  );

  return (
    <div className={`${styles.body} stagger`}>
      <section className={styles.card} aria-label="You">
        {profile?.character ? (
          <ProfileHero character={profile.character} name={profile.nickname}>
            {identity}
          </ProfileHero>
        ) : (
          <>
            <Avatar name={profile?.nickname} size={104} color="#ff4fa3" registered character={null} />
            <div className={styles.identity}>{identity}</div>
          </>
        )}
      </section>

      <section className={`${styles.card} ${styles.statsCard}`} aria-label="Your stats">
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Your stats</span>
          <Chip size="s">
            {gameStats.length} {gameStats.length === 1 ? "game" : "games"}
          </Chip>
        </div>
        {results.error && (
          <p role="alert" className={styles.empty}>
            Could not load your stats: {results.error.message}
          </p>
        )}
        {gameStats.length ? (
          <ul className={styles.statsList}>
            {gameStats.map((item) => (
              <li key={item.game.id} className={styles.statRow}>
                <span
                  className={`${styles.statTile} ${styles[`tile_${findGameType(item.game.type).tone}`]}`}
                  aria-hidden="true"
                >
                  {gameEmoji(item.game)}
                </span>
                <span className={styles.statText}>
                  <span className={styles.statName}>
                    <GameName game={item.game} />
                  </span>
                  <span className={styles.statChips}>
                    <Chip size="s">
                      {item.played} {item.played === 1 ? "session" : "sessions"}
                    </Chip>
                    <Chip size="s" tone="yellow">
                      {item.wins} {item.wins === 1 ? "win" : "wins"}
                    </Chip>
                  </span>
                </span>
                <span className={styles.statRate}>
                  <span className={styles.statRateValue}>
                    {item.winRate === null ? "–" : `${item.winRate}%`}
                  </span>
                  <span className={styles.statRateLabel}>win rate</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          !results.error && (
            <p className={styles.empty}>Log a session and your stats for each game appear here.</p>
          )
        )}
      </section>

      <section className={styles.card} aria-label="Your guests">
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>My guests</span>
          <Chip size="s">{guests?.length ?? 0}</Chip>
        </div>
        {guests?.length ? (
          <ul className={styles.guests}>
            {guests.map((guest) => (
              <li key={guest.id} className={styles.guestRow}>
                <Avatar name={guest.name} size={38} color="#c9bcc8" />
                <span className={`${styles.guestName} keep-case`}>{guest.name}</span>
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
          <p className={styles.empty}>
            Guests you add while logging a session appear here.
          </p>
        )}
      </section>

      <div className={styles.links}>
        <Link href="/profile/customize" className={styles.linkRow}>
          <span>Customize character</span>
          <span aria-hidden="true">&#8250;</span>
        </Link>
        <Link href="/profile/achievements" className={styles.linkRow}>
          <span>Achievements</span>
          <span aria-hidden="true">&#8250;</span>
        </Link>
        <Link href="/history" className={styles.linkRow}>
          <span>Session history</span>
          <span aria-hidden="true">&#8250;</span>
        </Link>
      </div>

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
    </div>
  );
}
