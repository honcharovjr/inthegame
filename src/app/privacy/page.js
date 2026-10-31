import Link from "next/link";
import UserText from "@/components/UserText/UserText";
import { getSiteSettings } from "@/lib/site/settings";
import styles from "./privacy.module.css";

export const metadata = { title: "privacy policy" };

// A setting from the admin panel, or a marked placeholder until it is set.
function Fill({ value, missing }) {
  if (value) return <UserText>{value}</UserText>;
  return <span className={styles.missing}>[{missing}]</span>;
}

function formatDay(day) {
  if (!day) return null;
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// The privacy policy (C28). Its details come from the admin settings (C31).
export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const email = settings.contact_email ? (
    <a href={`mailto:${settings.contact_email}`}>
      <UserText>{settings.contact_email}</UserText>
    </a>
  ) : (
    <Fill missing="contact email" />
  );

  return (
    <div className={styles.page}>
      <header className={styles.wrap}>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand}>
            in the game
          </Link>
          <Link href="/app" className={`${styles.login} btn-secondary`}>
            Log in
          </Link>
        </div>
      </header>

      <main className={`${styles.wrap} ${styles.main}`}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Privacy policy</h1>
          <p className={styles.text}>
            Last updated <Fill value={formatDay(settings.privacy_updated_on)} missing="date" />. This page explains
            what In the Game stores about you, why, who can see it and what you can ask us to do.
          </p>
        </div>

        <section className={styles.section}>
          <h2>Who runs In the Game</h2>
          <p className={styles.text}>
            In the Game is run by <Fill value={settings.operator_name} missing="operator name" />. Questions about your
            data: {email}.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What we store</h2>
          <ul className={styles.text}>
            <li>
              <strong>Your account:</strong> email address and password. The password is stored only as a secure
              hash by our login provider.
            </li>
            <li>
              <strong>Your profile:</strong> nickname and the look you choose for your character.
            </li>
            <li>
              <strong>Your games:</strong> the sessions you log or play in: game, date, players, results, scores and
              notes. Ratings, statistics and achievements are calculated from them.
            </li>
            <li>
              <strong>Guests:</strong> the names you type for friends without an account. Only a name, nothing else.
            </li>
            <li>
              <strong>Teams:</strong> the teams you create or join, and their invite links.
            </li>
            <li>
              <strong>Online games:</strong> invites, the game in progress and who is online in it while you play.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Why we store it</h2>
          <p className={styles.text}>
            Only to run the service you signed up for: saving your games and showing your history, ratings, rivals
            and achievements. We do not sell your data, show ads or use it for profiling. We do not use analytics
            tools.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Who can see it</h2>
          <ul className={styles.text}>
            <li>Your profile and sessions are visible to members of your teams and to players who were in the same session.</li>
            <li>Nobody outside the app can see them. There are no public profiles.</li>
            <li>The service providers below store data for us and may not use it for anything else.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Where it is stored</h2>
          <ul className={styles.text}>
            <li>
              <strong>Supabase</strong> keeps the database and handles logins, on servers in Ireland (EU).
            </li>
            <li>
              <strong>Vercel</strong> hosts the website. The parts that read your data run in Dublin (EU). Vercel is a
              US company.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Cookies and your browser</h2>
          <p className={styles.text}>
            We use one kind of cookie: the one that keeps you logged in. Your browser also remembers a few settings
            on your device only, such as sound on or off and a game in progress. They never leave your device.
          </p>
        </section>

        <section className={styles.section}>
          <h2>How long we keep it</h2>
          <p className={styles.text}>
            As long as your account exists. When you delete your account, your email and login are removed and your
            profile is renamed to a deleted player, so the games of your friends stay correct.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Your rights</h2>
          <p className={styles.text}>
            You can ask us to show you the data we hold about you, correct it, export it or delete it. Write to{" "}
            {email} and we will answer within 30 days. If you live in the EU, you can also complain to your data
            protection authority.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Age</h2>
          <p className={styles.text}>
            In the Game is for people aged <Fill value={settings.minimum_age} missing="minimum age" /> and older.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Changes</h2>
          <p className={styles.text}>
            When this policy changes, we update the date at the top. For important changes, we tell you in the app
            before they apply.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.bar}`}>
          <Link href="/">Back to the start page</Link>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
