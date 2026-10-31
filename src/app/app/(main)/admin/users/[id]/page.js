import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar/Avatar";
import BackButton from "@/components/BackButton/BackButton";
import Chip from "@/components/Chip/Chip";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireSuperAdmin } from "@/lib/admin/access";
import { loadUser } from "@/lib/admin/queries";
import { formatDate } from "../../format";
import BlockButton from "./BlockButton";
import styles from "../../admin.module.css";

export const metadata = { title: "admin: player" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminUser({ params }) {
  return (
    <main className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.stack}>
            <Skeleton height={140} radius={22} />
            <Skeleton height={200} radius={22} delay={80} />
          </div>
        }
      >
        <Player params={params} />
      </Suspense>
    </main>
  );
}

async function Player({ params }) {
  const me = await requireSuperAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await loadUser(id);
  if (!user) notFound();

  return (
    <div className={`${styles.stack} stagger`}>
      <div className={styles.backRow}>
        <BackButton fallback="/app/admin/users" />
        <span className={styles.kicker}>Admin panel · Players</span>
      </div>

      <section className={styles.profileCard}>
        <Avatar name={user.nickname} size={88} registered={!user.deleted} character={user.character} />
        <div className={styles.profileText}>
          <h1 className={`${styles.title} keep-case`}>{user.nickname}</h1>
          <span className={`${styles.rowMeta} ${user.email ? "keep-case" : ""}`}>{user.email ?? "No account"}</span>
          <span className={styles.rowMeta}>
            Joined {formatDate(user.createdAt)} · last login {formatDate(user.lastSignIn)}
          </span>
          <span className={styles.rowChips}>
            {user.isAdmin && <Chip size="s" tone="violet">Admin</Chip>}
            {user.blocked && <Chip size="s" tone="pink">Blocked</Chip>}
            {user.deleted && <Chip size="s">Deleted</Chip>}
          </span>
        </div>
        {!user.isAdmin && !user.deleted && user.id !== me.id && (
          <BlockButton profileId={user.id} nickname={user.nickname} blocked={user.blocked} />
        )}
      </section>

      <div className={styles.tiles}>
        <div className={`${styles.tile} ${styles.tile_turquoise}`}>
          <span className={styles.tileValue}>{user.sessions}</span>
          <span className={styles.tileLabel}>Sessions</span>
        </div>
        <div className={`${styles.tile} ${styles.tile_yellow}`}>
          <span className={styles.tileValue}>{user.teams.length}</span>
          <span className={styles.tileLabel}>Teams</span>
        </div>
        <div className={`${styles.tile} ${styles.tile_pink}`}>
          <span className={styles.tileValue}>{user.achievements}</span>
          <span className={styles.tileLabel}>Achievements</span>
        </div>
      </div>

      <div className={styles.split}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Recent sessions</h2>
          {user.recent.length === 0 ? (
            <p className={styles.empty}>No sessions yet.</p>
          ) : (
            <ul className={styles.log}>
              {user.recent.map((session) => (
                <li key={session.id} className={styles.logRow}>
                  <span className={styles.logText}>
                    <strong className={session.custom ? "keep-case" : undefined}>{session.game}</strong> · place{" "}
                    {session.place}
                    {session.score !== null ? ` · ${Number(session.score)} points` : ""}
                  </span>
                  <span className={styles.logDate}>{formatDate(session.playedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ratings</h2>
          {user.ratings.length === 0 ? (
            <p className={styles.empty}>No ratings yet.</p>
          ) : (
            <ol className={styles.rank}>
              {user.ratings.map((rating) => (
                <li key={rating.game} className={styles.rankRow}>
                  <span className={`${styles.rankName} ${rating.custom ? "keep-case" : ""}`}>{rating.game}</span>
                  <span className={styles.rowMeta}>{rating.games} games</span>
                  <span className={styles.rankValue}>{rating.rating}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Teams</h2>
          {user.teams.length === 0 ? (
            <p className={styles.empty}>Not in a team.</p>
          ) : (
            <ul className={styles.log}>
              {user.teams.map((team) => (
                <li key={team.id} className={styles.logRow}>
                  <span className={`${styles.logText} keep-case`}>{team.name}</span>
                  <Chip size="s" tone={team.role === "owner" ? "yellow" : "default"}>
                    {team.role === "owner" ? "Owner" : "Member"}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
