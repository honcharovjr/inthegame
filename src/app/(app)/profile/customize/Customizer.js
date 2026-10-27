"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Character from "@/components/Character/Character";
import Chip from "@/components/Chip/Chip";
import { LockIcon } from "@/components/icons";
import { findAchievement } from "@/lib/achievements/catalog";
import { saveCharacter } from "@/lib/character/actions";
import {
  ACCESSORIES,
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
import styles from "./customize.module.css";

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

// A row of options, each shown as the current character wearing it.
// full: show the whole figure, for options worn on the body.
function Options({ title, list, part, choice, set, preview, full = false }) {
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.tiles}>
        {list.map((item) => (
          <Tile key={item.code} label={item.label} selected={choice[part] === item.code} tall={full} onClick={() => set(part, item.code)}>
            <Character character={preview(part, item.code)} size={full ? 60 : 56} view={full ? "full" : "portrait"} />
          </Tile>
        ))}
      </div>
    </section>
  );
}

// A row of colours.
function Swatches({ title, list, part, choice, set }) {
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.tiles}>
        {list.map((item) => (
          <Tile key={item.code} label={item.label} selected={choice[part] === item.code} onClick={() => set(part, item.code)}>
            <span className={styles.swatch} style={{ background: item.hex }} />
          </Tile>
        ))}
      </div>
    </section>
  );
}

function unlockTip(item) {
  const achievement = findAchievement(item.unlockedBy);
  return `Locked. Earn ${achievement?.name}: ${achievement?.description}`;
}

// The customizer: a live preview and a row of options for every part.
export default function Customizer({ name, initial, earned }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState(resolveCharacter(initial));
  const [error, setError] = useState(null);
  const owned = new Set(earned);

  const set = (part, value) => setChoice((current) => ({ ...current, [part]: value }));
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

  const badges = earned.map(findAchievement).filter(Boolean);

  return (
    <div className={`${styles.body} stagger`}>
      <section className={styles.stage} aria-label="Preview">
        <Character character={choice} name={name} size={200} view="full" perks />
        <div className={styles.stageText}>
          <span className={styles.stageName}>{name}</span>
          {choice.accessory && (
            <Chip size="s" tone="yellow">
              {ACCESSORIES.find((a) => a.code === choice.accessory)?.perkText}
            </Chip>
          )}
        </div>
      </section>

      <Options title="Race" list={RACES} part="race" choice={choice} set={set} preview={preview} />
      <Swatches title="Skin tone" list={SKINS} part="skin" choice={choice} set={set} />
      <Options title="Hair" list={HAIRSTYLES} part="hair" choice={choice} set={set} preview={preview} />
      <Swatches title="Hair colour" list={HAIR_COLORS} part="hairColor" choice={choice} set={set} />
      <Options title="Beard" list={BEARDS} part="beard" choice={choice} set={set} preview={preview} />
      <Swatches title="Eye colour" list={EYE_COLORS} part="eyeColor" choice={choice} set={set} />
      <Options title="Outfit" list={OUTFITS} part="outfit" choice={choice} set={set} preview={preview} full />
      <Swatches title="Outfit colour" list={OUTFIT_COLORS} part="outfitColor" choice={choice} set={set} />

      <section className={styles.card} aria-label="Background">
        <div className={styles.cardTitle}>Background</div>
        <div className={styles.tiles}>
          {BACKGROUNDS.map((item) => (
            <Tile
              key={item.code}
              label={item.label}
              selected={choice.background === item.code}
              locked={!isUnlocked(item, owned)}
              tip={item.unlockedBy ? unlockTip(item) : ""}
              onClick={() => set("background", item.code)}
            >
              <Character character={preview("background", item.code)} size={56} />
            </Tile>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-label="Accessory">
        <div className={styles.cardTitle}>Accessory</div>
        <div className={styles.tiles}>
          <Tile label="None" selected={!choice.accessory} onClick={() => set("accessory", null)}>
            <span className={styles.tileText}>None</span>
          </Tile>
          {ACCESSORIES.map((item) => (
            <Tile
              key={item.code}
              label={item.label}
              selected={choice.accessory === item.code}
              locked={!isUnlocked(item, owned)}
              tip={unlockTip(item)}
              onClick={() => set("accessory", item.code)}
            >
              <span className={styles.tileText}>{item.label}</span>
            </Tile>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-label="Badge">
        <div className={styles.cardTitle}>Badge</div>
        {badges.length === 0 ? (
          <p className={styles.empty}>Earn an achievement to wear it as a badge.</p>
        ) : (
          <div className={styles.chips}>
            <button
              type="button"
              className={`${styles.badgeChip} ${!choice.badge ? styles.badgeOn : ""}`}
              aria-pressed={!choice.badge}
              onClick={() => set("badge", null)}
            >
              None
            </button>
            {badges.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`${styles.badgeChip} ${choice.badge === item.code ? styles.badgeOn : ""}`}
                aria-pressed={choice.badge === item.code}
                onClick={() => set("badge", item.code)}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.reset} btn-secondary`}
          onClick={() => setChoice({ ...DEFAULT_CHARACTER })}
        >
          Reset
        </button>
        <button
          type="button"
          className={`${styles.save} btn-primary`}
          onClick={save}
          disabled={pending}
        >
          {pending ? "Saving" : "Save character"}
        </button>
      </div>
    </div>
  );
}
