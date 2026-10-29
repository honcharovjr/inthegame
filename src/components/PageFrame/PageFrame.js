import styles from "./PageFrame.module.css";

// The frame of a top page (Home, Games, Teams, Profile, History): the same
// padding and width everywhere.
export default function PageFrame({ children, className = "" }) {
  return <main className={`${styles.frame} ${className}`}>{children}</main>;
}

// The top of a page: its name, big and without a box, and the page's main
// actions beside it on a wide screen, or under it on a phone.
export function PageTop({ title, children }) {
  return (
    <header className={styles.top}>
      <h1 className={styles.title}>{title}</h1>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}

// A small grey heading above a group of numbers.
export function AsideTitle({ children }) {
  return <p className={styles.asideTitle}>{children}</p>;
}
