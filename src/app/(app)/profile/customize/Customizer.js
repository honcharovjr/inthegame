"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Character from "@/components/Character/Character";
import { LockIcon } from "@/components/icons";
import { findAchievement } from "@/lib/achievements/catalog";
import { saveCharacter } from "@/lib/character/actions";
import {
  BACKGROUNDS,
  BEARDS,
  DEFAULT_CHARACTER,
  EYE_COLORS,
  HAIR_COLORS,
  HAIRSTYLES,
  OUTFIT_COLORS,
  OUTFITS,
  RACES,
  SKINS,
  isUnlocked,
  resolveCharacter,
} from "@/lib/character/items";
import { camera } from "@/lib/character/render";
import styles from "./customize.module.css";

// The tabs of the panel. Each shows its styles first, then their colours,
// and points the camera at the part it changes.
const TABS = [
  { code: "race", label: "Race", focus: "bust", style: ["race", RACES], color: ["skin", SKINS, "Skin tone"] },
  { code: "hair", label: "Hair", focus: "head", style: ["hair", HAIRSTYLES], color: ["hairColor", HAIR_COLORS, "Hair colour"] },
  { code: "beard", label: "Beard", focus: "head", style: ["beard", BEARDS], color: ["hairColor", HAIR_COLORS, "Hair colour"] },
  { code: "eyes", label: "Eyes", focus: "eyes", color: ["eyeColor", EYE_COLORS, "Eye colour"] },
  { code: "outfit", label: "Outfit", focus: "body", style: ["outfit", OUTFITS], color: ["outfitColor", OUTFIT_COLORS, "Cloth colour"], full: true },
  { code: "background", label: "Background", focus: "body", style: ["background", BACKGROUNDS] },
];

// One option tile. A locked tile is dimmed and says what unlocks it.
function Tile({ selected, locked, tip, label, onClick, tall = false, children }) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${tall ? styles.tileTall : ""} ${selected ? styles.tileOn : ""} ${locked ? styles.tileLocked : ""}`}
      aria-pressed={selected}
      aria-disabled={locked || undefined}
      aria-label={locked ? `${label}, locked. ${tip}` : label}
      data-tip={locked ? tip : label}
      data-tip-pos="below"
      onClick={locked ? undefined : onClick}
    >
      {children}
      {locked && (
        <span className={styles.lock} aria-hidden="true">
          <LockIcon size={14} />
        </span>
      )}
    </button>
  );
}

function unlockTip(item) {
  const achievement = findAchievement(item.unlockedBy);
  return `Locked. Earn ${achievement?.name}: ${achievement?.description}`;
}

// The character on its stage. A change fades over the last look instead of
// swapping at once, and the camera glides to the part being edited.
function Stage({ frames, name, focus }) {
  const current = frames[frames.length - 1].choice;
  const shot = camera(current.race, focus);
  const lens = {
    transform: `scale(${shot.scale}) translate(${-(shot.x - 0.5 / shot.scale) * 100}%, ${-(shot.y - 0.5 / shot.scale) * 100}%)`,
  };
  return (
    <div className={styles.frame}>
      <div className={styles.lens} style={lens}>
        {frames.map((frame, i) => (
          <div key={frame.id} className={`${styles.shot} ${i < frames.length - 1 ? styles.leaving : ""}`}>
            <Character character={frame.choice} name={name} size="fill" view="full" perks={i === frames.length - 1} />
          </div>
        ))}
      </div>
      <span className={styles.name}>{name}</span>
    </div>
  );
}

// The customizer: the character on the left, always in view, and a panel of
// tabs on the right. On a phone the character sits on top.
export default function Customizer({ name, initial, earned }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // The last two looks: the one fading out and the one now shown.
  const [frames, setFrames] = useState([{ id: 0, choice: resolveCharacter(initial) }]);
  const [tab, setTab] = useState(TABS[0]);
  const [error, setError] = useState(null);
  const owned = new Set(earned);
  const choice = frames[frames.length - 1].choice;

  function show(next) {
    setFrames((list) => {
      const last = list[list.length - 1];
      return [last, { id: last.id + 1, choice: next }];
    });
  }
  const set = (part, value) => {
    if (choice[part] !== value) show({ ...choice, [part]: value });
  };
  // A small preview of one option, worn on the current choice
  const preview = (part, value) => ({ ...choice, [part]: value });

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCharacter(choice);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/profile");
    });
  }

  const [stylePart, styleList] = tab.style ?? [];
  const [colorPart, colorList, colorTitle] = tab.color ?? [];

  return (
    <div className={styles.layout}>
      {/* On a desktop the character and the buttons stay in view together */}
      <div className={styles.side}>
        <section className={styles.stage} aria-label="Preview">
          <Stage frames={frames} name={name} focus={tab.focus} />
        </section>
        <div className={styles.actions}>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <button
            type="button"
            className={`${styles.reset} btn-secondary`}
            onClick={() => show({ ...DEFAULT_CHARACTER, accessory: choice.accessory, badge: choice.badge })}
          >
            Reset
          </button>
          <button type="button" className={`${styles.save} btn-primary`} onClick={save} disabled={pending}>
            {pending ? "Saving" : "Save character"}
          </button>
        </div>
      </div>

      <section className={styles.panel} aria-label="Options">
        <div className={styles.tabs} role="tablist">
          {TABS.map((item) => (
            <button
              key={item.code}
              type="button"
              role="tab"
              aria-selected={tab.code === item.code}
              className={`${styles.tab} ${tab.code === item.code ? styles.tabOn : ""}`}
              onClick={() => setTab(item)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div key={tab.code} className={styles.tabBody} role="tabpanel" aria-label={tab.label}>
          {stylePart && (
            <div>
              <div className={styles.groupTitle}>Style</div>
              <div className={styles.tiles}>
                {styleList.map((item) => (
                  <Tile
                    key={item.code}
                    label={item.label}
                    selected={choice[stylePart] === item.code}
                    locked={!isUnlocked(item, owned)}
                    tip={item.unlockedBy ? unlockTip(item) : ""}
                    tall={tab.full}
                    onClick={() => set(stylePart, item.code)}
                  >
                    <Character
                      character={preview(stylePart, item.code)}
                      size={tab.full ? 60 : 56}
                      view={tab.full ? "full" : "portrait"}
                    />
                  </Tile>
                ))}
              </div>
            </div>
          )}

          {colorPart && (
            <div>
              <div className={styles.groupTitle}>{colorTitle}</div>
              <div className={styles.swatches}>
                {colorList.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`${styles.swatch} ${choice[colorPart] === item.code ? styles.swatchOn : ""}`}
                    style={{ background: item.hex }}
                    aria-pressed={choice[colorPart] === item.code}
                    aria-label={item.label}
                    data-tip={item.label}
                    data-tip-pos="below"
                    onClick={() => set(colorPart, item.code)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
