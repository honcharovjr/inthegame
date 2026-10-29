import styles from "./PageFrame.module.css";

// The frame of a top page (Home, Games, Teams, Profile, History): the same
// padding everywhere, and a top row of the poster with a side block beside it
// on a wide screen, or under it on a phone.
export default function PageFrame({ children, className = "" }) {
  return <main className={`${styles.frame} ${className}`}>{children}</main>;
}

// poster: a Poster. aside: what the page shows next to it. label names the
// side block for screen readers.
export function PageTop({ poster, aside, label }) {
  return (
    <div className={styles.top}>
      {poster}
      <aside className={styles.aside} aria-label={label}>
        {aside}
      </aside>
    </div>
  );
}

// A small grey heading inside the side block.
export function AsideTitle({ children }) {
  return <p className={styles.asideTitle}>{children}</p>;
}
