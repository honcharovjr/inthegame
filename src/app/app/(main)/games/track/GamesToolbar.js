"use client";

import { useFilterLoading } from "@/components/FilterLoading/FilterLoading";
import IconButton from "@/components/IconButton/IconButton";
import { ResetIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { useState } from "react";
import styles from "./games.module.css";

// The filter panel of the catalog, laid out like the one in the history:
// search, players and reset in one row, the game types below as children.
// playerHrefs holds the page address for every stop of the slider, stop 0
// meaning any number. The page changes when the thumb is let go, so dragging
// does not fire a request per step.
export default function GamesToolbar({ filters, playerHrefs, children }) {
  const { go } = useFilterLoading();
  const value = filters.players ?? 0;
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }

  const last = playerHrefs.length - 1;
  const active = Boolean(filters.q || filters.type || filters.players);

  function commit(next) {
    if (next !== value) go(playerHrefs[next], { replace: true });
  }

  return (
    <section className={styles.panel} aria-label="Filters">
      <form
        method="get"
        role="search"
        className={styles.search}
        onSubmit={(event) => {
          // Search without leaving the page, so the results can show a skeleton
          event.preventDefault();
          const query = new URLSearchParams();
          for (const [key, text] of new FormData(event.currentTarget)) {
            if (String(text).trim()) query.set(key, String(text).trim());
          }
          const text = query.toString();
          go(text ? `/app/games/track?${text}` : "/app/games/track");
        }}
      >
        <SearchIcon size={20} />
        <input
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search games"
          aria-label="Search games"
        />
        {filters.type && <input type="hidden" name="type" value={filters.type} />}
        {filters.players && (
          <input type="hidden" name="players" value={filters.players} />
        )}
      </form>

      <div className={styles.slider}>
        <span
          className={styles.sliderIcon}
          data-tip="Players"
          data-tip-pos="below"
          tabIndex={0}
          role="img"
          aria-label="Players"
        >
          <UsersIcon size={20} />
        </span>
        <div className={styles.sliderBody}>
          <input
            className={styles.range}
            type="range"
            min={0}
            max={last}
            step={1}
            value={draft}
            style={{ "--p": draft / last }}
            aria-label="Number of players"
            aria-valuetext={draft ? `${draft} players` : "Any number of players"}
            onChange={(event) => setDraft(Number(event.target.value))}
            onPointerUp={(event) => commit(Number(event.currentTarget.value))}
            onKeyUp={(event) => commit(Number(event.currentTarget.value))}
          />
          <div className={styles.ticks} aria-hidden="true">
            {playerHrefs.map((_, index) => (
              <span key={index} className={index === draft ? styles.tickOn : ""}>
                {index === 0 ? "Any" : index}
              </span>
            ))}
          </div>
        </div>
      </div>

      <IconButton
        size={46}
        tipAlign="end"
        label="Reset filters"
        icon={<ResetIcon size={20} />}
        disabled={!active}
        onClick={() => go("/app/games/track")}
      />

      {children}
    </section>
  );
}
