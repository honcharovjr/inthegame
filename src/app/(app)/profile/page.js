import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import Skeleton from "@/components/Skeleton/Skeleton";
import { signOut } from "@/lib/auth/actions";
import { getProfile } from "@/lib/auth/session";
import { deleteGuest } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/server";
import NicknameForm from "./NicknameForm";
import styles from "./profile.module.css";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <main className={styles.page}>
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
      <Skeleton height={110} radius={22} delay={80} />
      <Skeleton height={150} radius={22} delay={160} />
    </div>
  );
}

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

// Reads the session and the database, so it streams in behind Suspense.
async function ProfileContent() {
  const { profile } = await getProfile();
  const supabase = await createClient();
  const { data: guests } = await supabase
    .from("guests")
    .select("id, name")
    .eq("owner_id", profile?.id)
    .order("created_at");

  return (
    <div className={`${styles.body} stagger`}>
      <section className={styles.card} aria-label="You">
        <Avatar name={profile?.nickname} size={72} color="#ff4fa3" />
        <div className={styles.identity}>
          <div className={styles.name}>{profile?.nickname}</div>
          {profile?.created_at && (
            <Chip>
              Playing since {monthFormat.format(new Date(profile.created_at))}
            </Chip>
          )}
        </div>
      </section>

      <section className={styles.card} aria-label="Nickname">
        <NicknameForm nickname={profile?.nickname ?? ""} />
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
                <span className={styles.guestName}>{guest.name}</span>
                <ConfirmButton
                  title="Remove this guest?"
                  message={`${guest.name} will be removed from your guest list.`}
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
        <Link href="/history" className={styles.linkRow}>
          <span>Session history</span>
          <span aria-hidden="true">&#8250;</span>
        </Link>
      </div>

      <form action={signOut}>
        <button type="submit" className={`${styles.signOut} btn-secondary`}>
          Log out
        </button>
      </form>
    </div>
  );
}
