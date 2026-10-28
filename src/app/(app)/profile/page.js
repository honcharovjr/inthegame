import BackButton from "@/components/BackButton/BackButton";
import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import PlayingSince from "@/components/PlayingSince/PlayingSince";
import { LogoutIcon, PenIcon } from "@/components/icons";
import Skeleton from "@/components/Skeleton/Skeleton";
import { nameStyle } from "@/lib/character/items";
import { signOut } from "@/lib/auth/actions";
import { getProfile } from "@/lib/auth/session";
import { deleteGuest } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/server";
import UserText from "@/components/UserText/UserText";
import NicknameForm from "./NicknameForm";
import ProfileHero from "./ProfileHero";
import styles from "./profile.module.css";

export const metadata = { title: "profile" };

export default function ProfilePage() {
  return (
    <main className={styles.page}>
      <BackButton fallback="/" />
      <h1 className={styles.title}>Profile</h1>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </main>
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
  const { data: guests } = await supabase
    .from("guests")
    .select("id, name")
    .eq("owner_id", profile?.id)
    .order("created_at");

  const identity = (
    <>
      <NicknameForm nickname={profile?.nickname ?? ""} nameClass={nameStyle(profile?.character)} />
      {profile?.created_at && <PlayingSince date={profile.created_at} />}
      <Link href="/profile/customize" className={`${styles.customize} btn-secondary`}>
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
