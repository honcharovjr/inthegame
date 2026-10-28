"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/icons";
import { GameName } from "@/components/UserText/UserText";
import styles from "./GameSelect.module.css";

// A drop-down of games with a search box on top.
// games: [{ id, name }]. value is a game id or "" for all games.
export default function GameSelect({ games, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = games.find((game) => game.id === value);
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text
      ? games.filter((game) => game.name.toLowerCase().includes(text))
      : games;
  }, [games, query]);

  function choose(id) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.trigger} ${selected ? styles.triggerOn : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.value}>{selected ? <GameName game={selected} /> : "All games"}</span>
        <ChevronDownIcon size={18} />
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.search}>
            <SearchIcon size={18} />
            <input
              className={styles.searchInput}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              aria-label="Search games"
              autoFocus
            />
          </div>
          <ul className={styles.list} role="listbox" aria-label="Games">
            {!query && (
              <li role="option" aria-selected={!value}>
                <button
                  type="button"
                  className={`${styles.option} ${!value ? styles.optionOn : ""}`}
                  onClick={() => choose("")}
                >
                  All games
                </button>
              </li>
            )}
            {visible.map((game) => (
              <li key={game.id} role="option" aria-selected={game.id === value}>
                <button
                  type="button"
                  className={`${styles.option} ${game.id === value ? styles.optionOn : ""}`}
                  onClick={() => choose(game.id)}
                >
                  <GameName game={game} />
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className={styles.none}>No games match.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
