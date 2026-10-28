import { Suspense } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import { requireSuperAdmin } from "@/lib/admin/access";
import { loadDashboard } from "@/lib/admin/queries";
import AdminHeader from "./AdminHeader";
import { describeAction, formatDate } from "./format";
import styles from "./admin.module.css";

export const metadata = { title: "Admin" };

export default function AdminOverview() {
  return (
    <main className={styles.page}>
      <AdminHeader active="overview" title="Overview" />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </main>
  );
}

function OverviewSkeleton() {
  return (
    <div className={styles.stack}>
      <Skeleton height={96} radius={22} />
      <Skeleton height={220} radius={22} delay={80} />
      <Skeleton height={180} radius={22} delay={160} />
    </div>
  );
}

async function Overview() {
  await requireSuperAdmin();
  const { totals, stats, audit } = await loadDashboard();
  const peak = Math.max(1, ...stats.weekly.map((w) => Math.max(w.sessions, w.signups)));

  return (
    <div className={`${styles.stack} stagger`}>
      <div className={styles.tiles}>
        <Tile label="Players" value={totals.players} tone="pink" />
        <Tile label="Sessions" value={totals.sessions} tone="turquoise" />
        <Tile label="Catalog games" value={totals.catalog} tone="yellow" />
        <Tile label="Teams" value={totals.teams} tone="violet" />
      </div>

      <div className={styles.tiles}>
        <Tile label="Active, 7 days" value={stats.active7} />
        <Tile label="Active, 30 days" value={stats.active30} />
        <Tile
          label="Returning, 8 weeks"
          value={`${Math.round(stats.returningShare * 100)}%`}
          note={`${stats.returning} of ${stats.activeInWindow} active players`}
        />
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Last 8 weeks</h2>
          <span className={styles.legend}>
            <span className={styles.keySessions} /> Sessions
            <span className={styles.keySignups} /> Sign-ups
          </span>
        </div>
        <div className={styles.chart} role="img" aria-label="Sessions and sign-ups per week">
          {stats.weekly.map((week) => (
            <div key={week.start} className={styles.week}>
              <div className={styles.bars}>
                <span
                  className={styles.barSessions}
                  style={{ height: `${(week.sessions / peak) * 100}%` }}
                  data-tip={`${week.sessions} sessions`}
                />
                <span
                  className={styles.barSignups}
                  style={{ height: `${(week.signups / peak) * 100}%` }}
                  data-tip={`${week.signups} sign-ups`}
                />
              </div>
              <span className={styles.weekLabel}>{formatDate(week.start, { short: true })}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.split}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Top games, 30 days</h2>
          {stats.topGames.length === 0 ? (
            <p className={styles.empty}>No sessions in the last 30 days.</p>
          ) : (
            <ol className={styles.rank}>
              {stats.topGames.map((game, index) => (
                <li key={game.id} className={styles.rankRow}>
                  <span className={styles.rankNo}>{index + 1}</span>
                  <span className={styles.rankName}>{game.name}</span>
                  <span className={styles.rankValue}>{game.sessions}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Admin activity</h2>
          {audit.length === 0 ? (
            <p className={styles.empty}>No admin actions yet.</p>
          ) : (
            <ul className={styles.log}>
              {audit.map((entry) => (
                <li key={entry.id} className={styles.logRow}>
                  <span className={styles.logText}>
                    <strong>{entry.profiles?.nickname ?? "Admin"}</strong> {describeAction(entry)}
                  </span>
                  <span className={styles.logDate}>{formatDate(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value, note, tone = "white" }) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
      {note && <span className={styles.tileNote}>{note}</span>}
    </div>
  );
}
