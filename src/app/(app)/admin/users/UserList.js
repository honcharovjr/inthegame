"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import Chip from "@/components/Chip/Chip";
import { playerColor } from "@/lib/sessions/colors";
import { formatDate } from "../format";
import styles from "../admin.module.css";

const PAGE_SIZE = 30;
const FILTERS = [
  { id: "all", label: "All" },
  { id: "admins", label: "Admins" },
  { id: "blocked", label: "Blocked" },
];

// All players, searchable by nickname or email.
export default function UserList({ users }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const text = query.trim().toLowerCase();
  const shown = users.filter(
    (user) =>
      (filter === "all" || (filter === "admins" ? user.isAdmin : user.blocked)) &&
      (!text ||
        user.nickname.toLowerCase().includes(text) ||
        (user.email ?? "").toLowerCase().includes(text)),
  );

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder={`Search ${users.length} players by name or email`}
          aria-label="Search players"
        />
      </div>
      <div className={styles.filters} role="group" aria-label="Show">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.filter} ${filter === item.id ? styles.filterOn : ""}`}
            aria-pressed={filter === item.id}
            onClick={() => {
              setFilter(item.id);
              setLimit(PAGE_SIZE);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className={styles.list}>
        {shown.slice(0, limit).map((user, index) => (
          <li key={user.id}>
            <Link href={`/admin/users/${user.id}`} className={`${styles.row} ${styles.rowLink}`}>
              <Avatar name={user.nickname} size={44} color={playerColor(index)} registered={!user.deleted} character={user.character} />
              <span className={styles.rowText}>
                <span className={`${styles.rowName} keep-case`}>{user.nickname}</span>
                <span className={`${styles.rowMeta} ${user.email ? "keep-case" : ""}`}>{user.email ?? "No account"}</span>
                <span className={styles.rowMeta}>
                  Joined {formatDate(user.createdAt)} · last login {formatDate(user.lastSignIn)} ·{" "}
                  {user.sessions} sessions · {user.teams} teams
                </span>
              </span>
              <span className={styles.rowChips}>
                {user.isAdmin && <Chip size="s" tone="violet">Admin</Chip>}
                {user.blocked && <Chip size="s" tone="pink">Blocked</Chip>}
                {user.deleted && <Chip size="s">Deleted</Chip>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className={styles.empty}>No players match.</p>}
      {shown.length > limit && (
        <button type="button" className={`${styles.smallButton} btn-secondary`} onClick={() => setLimit(limit + PAGE_SIZE)}>
          Show more
        </button>
      )}
    </div>
  );
}
