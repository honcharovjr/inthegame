"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TabBar.module.css";

const ICONS = {
  home: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z",
  games: "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z",
  log: "M12 5v14M5 12h14",
  groups:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17 14a5.5 5.5 0 0 1 3.5 5",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0",
};

// href is null for screens that are not built yet.
const TABS = [
  { id: "home", label: "Home", href: "/" },
  { id: "games", label: "Games", href: "/games" },
  { id: "log", label: "Log a session", href: "/log" },
  { id: "groups", label: "Groups", href: null },
  { id: "profile", label: "Profile", href: null },
];

// Floating capsule menu with icon tabs. The active tab is a pink circle.
export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.bar} aria-label="Main">
      <div className={styles.brand}>In the Game</div>
      {TABS.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : Boolean(tab.href) && pathname.startsWith(tab.href);
        const className = [
          styles.tab,
          active && styles.active,
          !tab.href && styles.soon,
        ]
          .filter(Boolean)
          .join(" ");
        const icon = (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={ICONS[tab.id]} />
          </svg>
        );
        const label = <span className={styles.label}>{tab.label}</span>;

        return tab.href ? (
          <Link
            key={tab.id}
            href={tab.href}
            className={className}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
          >
            {icon}
            {label}
          </Link>
        ) : (
          <span
            key={tab.id}
            className={className}
            aria-label={tab.label}
            aria-disabled="true"
            role="link"
          >
            {icon}
            {label}
          </span>
        );
      })}
    </nav>
  );
}
