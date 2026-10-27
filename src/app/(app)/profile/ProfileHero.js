"use client";

import { useState } from "react";
import Character from "@/components/Character/Character";
import { CollapseIcon, ExpandIcon } from "@/components/icons";
import { findBackground, resolveCharacter } from "@/lib/character/items";
import { portraitInFull } from "@/lib/character/render";
import styles from "./profile.module.css";

const SMALL = 104;
const LARGE = 220;

// The top of the profile: the character and the details beside it. The
// round avatar grows into the whole figure: the full view is always drawn,
// and while closed it is scaled and moved so only the head fills the circle.
export default function ProfileHero({ character, name, children }) {
  const [open, setOpen] = useState(false);
  const race = resolveCharacter(character).race;
  const { x, y, w, aspect } = portraitInFull(race);
  const scale = SMALL / (w * LARGE);
  const closed = `translate(${(-x * SMALL) / w}px, ${(-y * SMALL) / w}px) scale(${scale})`;
  const box = open
    ? { width: LARGE, height: Math.round(LARGE * aspect), borderRadius: 18 }
    : { width: SMALL, height: SMALL, borderRadius: SMALL / 2 };

  return (
    <div className={`${styles.hero} ${open ? styles.heroOpen : ""}`}>
      <div className={styles.heroArt}>
        <div
          className={styles.heroBox}
          style={{ ...box, background: findBackground(resolveCharacter(character).background).fill }}
        >
          <div className={styles.heroFigure} style={{ width: LARGE, transform: open ? "none" : closed }}>
            <Character character={character} name={name} size={LARGE} view="full" perks />
          </div>
        </div>
        <button
          type="button"
          className={styles.heroToggle}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Show the portrait" : "Show full size"}
          data-tip={open ? "Show the portrait" : "Show full size"}
          data-tip-pos="below"
        >
          {open ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
        </button>
      </div>
      <div className={styles.identity}>{children}</div>
    </div>
  );
}
