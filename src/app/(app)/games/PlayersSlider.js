"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UsersIcon } from "@/components/icons";
import styles from "./games.module.css";

// A slider with one stop for each player count. Stop 0 means any number.
// hrefs holds the page address for every stop. The page changes when the
// thumb is let go, so dragging does not fire a request per step.
export default function PlayersSlider({ value, hrefs }) {
  const router = useRouter();
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }

  const last = hrefs.length - 1;

  function commit(next) {
    if (next !== value) router.replace(hrefs[next], { scroll: false });
  }

  return (
    <div className={styles.slider}>
      <div className={styles.sliderHead}>
        <span className={styles.sliderLabel}>
          <UsersIcon size={16} />
          Players
        </span>
        <span className={`${styles.sliderValue} ${draft ? styles.sliderValueOn : ""}`}>
          {draft ? draft : "Any"}
        </span>
      </div>
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
        {hrefs.map((_, index) => (
          <span key={index} className={index === draft ? styles.tickOn : ""}>
            {index === 0 ? "Any" : index}
          </span>
        ))}
      </div>
    </div>
  );
}
