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
  BODIES,
  COLORS,
  DEFAULT_CHARACTER,
  EYES,
  MOUTHS,
  isUnlocked,
  resolveCharacter,
} from "@/lib/character/items";
import styles from "./customize.module.css";

// One option tile. A locked tile is dimmed and says what unlocks it.
function Tile({ selected, locked, tip, label, onClick, children }) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${selected ? styles.tileOn : ""} ${locked ? styles.tileLocked : ""}`}
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
        <Character character={choice} name={name} size={168} perks />
        <div className={styles.stageText}>
          <span className={styles.stageName}>{name}</span>
          {choice.accessory && (
            <Chip size="s" tone="yellow">
              {ACCESSORIES.find((a) => a.code === choice.accessory)?.perkText}
            </Chip>
          )}
        </div>
      </section>

      <section className={styles.card} aria-label="Body shape">
        <div className={styles.cardTitle}>Body shape</div>
        <div className={styles.tiles}>
          {BODIES.map((item) => (
            <Tile key={item.code} label={item.label} selected={choice.body === item.code} onClick={() => set("body", item.code)}>
              <Character character={preview("body", item.code)} size={56} />
            </Tile>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-label="Colour">
        <div className={styles.cardTitle}>Colour</div>
        <div className={styles.tiles}>
          {COLORS.map((item) => (
            <Tile key={item.code} label={item.label} selected={choice.color === item.code} onClick={() => set("color", item.code)}>
              <span className={styles.swatch} style={{ background: item.hex }} />
            </Tile>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-label="Eyes">
        <div className={styles.cardTitle}>Eyes</div>
        <div className={styles.tiles}>
          {EYES.map((item) => (
            <Tile key={item.code} label={item.label} selected={choice.eyes === item.code} onClick={() => set("eyes", item.code)}>
              <Character character={preview("eyes", item.code)} size={56} />
            </Tile>
          ))}
        </div>
      </section>

      <section className={styles.card} aria-label="Mouth">
        <div className={styles.cardTitle}>Mouth</div>
        <div className={styles.tiles}>
          {MOUTHS.map((item) => (
            <Tile key={item.code} label={item.label} selected={choice.mouth === item.code} onClick={() => set("mouth", item.code)}>
              <Character character={preview("mouth", item.code)} size={56} />
            </Tile>
          ))}
        </div>
      </section>

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
            <Character character={preview("accessory", null)} size={56} />
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
              <Character character={preview("accessory", item.code)} size={56} />
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
