"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Character from "@/components/Character/Character";
import GearIcon from "@/components/GearIcon/GearIcon";
import { DiceIcon, LockIcon } from "@/components/icons";
import { findAchievement } from "@/lib/achievements/catalog";
import { saveCharacter } from "@/lib/character/actions";
import { GEAR_SLOTS, MOCK_GEAR } from "@/lib/character/gear";
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
  findAccessory,
  isUnlocked,
  randomCharacter,
  resolveCharacter,
} from "@/lib/character/items";
import { camera } from "@/lib/character/render";
import styles from "./wardrobe.module.css";

// The tabs of the look. Each shows its styles first, then their colours,
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

// The character in its frame. A change fades over the last look with a small
// bounce instead of swapping at once, the character breathes while idle, and
// the camera glides to the part being edited.
function Figure({ frames, name, focus, rolling, onRoll, saved }) {
  const current = frames[frames.length - 1].choice;
  const shot = camera(current.race, focus);
  const lens = {
    transform: `scale(${shot.scale}) translate(${-(shot.x - 0.5 / shot.scale) * 100}%, ${-(shot.y - 0.5 / shot.scale) * 100}%)`,
  };
  return (
    <div className={styles.frame}>
      <div className={styles.lens} style={lens}>
        <div className={styles.alive}>
          {frames.map((frame, i) => (
            <div
              key={frame.id}
              className={`${styles.shot} ${i < frames.length - 1 ? styles.leaving : frame.id > 0 ? styles.entering : ""}`}
            >
              <Character character={frame.choice} name={name} size="fill" view="full" perks={i === frames.length - 1} />
            </div>
          ))}
        </div>
      </div>
      {onRoll && (
        <button
          type="button"
          className={`${styles.dice} ${rolling ? styles.diceRolling : ""}`}
          onClick={onRoll}
          aria-label="Roll a random look"
          data-tip="Roll a random look"
          data-tip-align="end"
          data-tip-pos="below"
        >
          <DiceIcon size={22} />
        </button>
      )}
      {saved && (
        <div className={styles.cheer} aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ "--a": `${i * 30}deg`, "--c": ["#ff4fa3", "#ffc928", "#2fd6d6", "#8f7bff"][i % 4] }} />
          ))}
          <span className={styles.cheerText}>Looking sharp!</span>
        </div>
      )}
    </div>
  );
}

// An empty gear slot beside the character. Gear is not built yet.
function GearSlot({ slot }) {
  return (
    <span className={styles.slot} data-tip={`${slot.label}: soon`} data-tip-pos="below">
      <GearIcon slot={slot.code} size={34} />
      <span className={styles.slotName}>{slot.label}</span>
      <span className={styles.slotLock} aria-hidden="true">
        <LockIcon size={11} />
      </span>
    </span>
  );
}

// The gear side of the panel: mock items by slot, all locked for now.
function GearPanel() {
  const [slot, setSlot] = useState("all");
  const items = slot === "all" ? MOCK_GEAR : MOCK_GEAR.filter((item) => item.slot === slot);
  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Gear slot">
        {[{ code: "all", label: "All" }, ...GEAR_SLOTS].map((item) => (
          <button
            key={item.code}
            type="button"
            role="tab"
            aria-selected={slot === item.code}
            className={`${styles.tab} ${slot === item.code ? styles.tabOn : ""}`}
            onClick={() => setSlot(item.code)}
          >
            {item.code !== "all" && <GearIcon slot={item.code} size={18} />}
            {item.label}
          </button>
        ))}
      </div>
      <ul key={slot} className={styles.items} role="tabpanel">
        {items.map((item) => (
          <li key={item.name} className={`${styles.item} ${styles[`item_${item.tone}`]}`}>
            <GearIcon slot={item.slot} size={40} />
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemLock}>
              <LockIcon size={14} />
              Soon
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

// The look side of the panel: the parts of the character and their colours.
function LookPanel({ tab, setTab, choice, owned, set, preview }) {
  const [stylePart, styleList] = tab.style ?? [];
  const [colorPart, colorList, colorTitle] = tab.color ?? [];
  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Part">
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
    </>
  );
}

// The top of the profile, like the gear screen of a game: the character on a
// bright stage with the gear slots around it, and a panel beside it that
// switches between the gear and the look. identity: the name and its editor.
// stats: [{ label, value, icon }].
export default function Wardrobe({ name, initial, earned, startOnLook, identity, kind, stats }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(startOnLook ? "look" : "gear");
  // The last two looks: the one fading out and the one now shown.
  const [frames, setFrames] = useState([{ id: 0, choice: resolveCharacter(initial) }]);
  const [tab, setTab] = useState(TABS[0]);
  const [error, setError] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [saved, setSaved] = useState(false);
  const owned = new Set(earned);
  const choice = frames[frames.length - 1].choice;
  const looking = mode === "look";
  const perk = findAccessory(choice.accessory);

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

  // The dice: a few quick random looks, settling on the last one.
  function roll() {
    if (rolling) return;
    setRolling(true);
    let left = 5;
    const step = () => {
      show(randomCharacter(choice, owned));
      left -= 1;
      if (left > 0) setTimeout(step, 110);
      else setRolling(false);
    };
    step();
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCharacter(choice);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // A short cheer, then back to the gear
      setSaved(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSaved(false);
      setMode("gear");
      router.replace("/profile", { scroll: false });
      router.refresh();
    });
  }

  // Leaving the look without saving puts the saved look back.
  function switchTo(next) {
    if (next === mode) return;
    if (next === "gear") show(resolveCharacter(initial));
    setError(null);
    setMode(next);
  }

  return (
    <div className={styles.wardrobe}>
      <section className={styles.stage} aria-label="Your character">
        <div className={styles.stageTop}>
          <div className={styles.identity}>
            {identity}
            <span className={styles.kind}>{kind}</span>
          </div>
        </div>

        <div className={styles.rig}>
          <div className={styles.slots}>
            {GEAR_SLOTS.slice(0, 3).map((slot) => (
              <GearSlot key={slot.code} slot={slot} />
            ))}
          </div>
          <Figure
            frames={frames}
            name={name}
            focus={looking ? tab.focus : "body"}
            rolling={rolling}
            onRoll={looking ? roll : null}
            saved={saved}
          />
          <div className={styles.slots}>
            {GEAR_SLOTS.slice(3).map((slot) => (
              <GearSlot key={slot.code} slot={slot} />
            ))}
          </div>
        </div>

        {perk && (
          <div className={styles.perk}>
            <span className={styles.perkIcon} aria-hidden="true">
              ★
            </span>
            <span className={styles.perkText}>
              <span>{perk.label} perk</span>
              <span className={styles.perkValue}>{perk.perkText}</span>
            </span>
          </div>
        )}

        <ul className={styles.stats}>
          {stats.map((item) => (
            <li key={item.label} className={styles.stat}>
              <span className={styles.statIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.statText}>
                <span className={styles.statLabel}>{item.label}</span>
                <span className={styles.statValue}>{item.value}</span>
              </span>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          {looking ? (
            <>
              <button
                type="button"
                className={`${styles.chunky} ${styles.chunkyLight}`}
                onClick={() => show({ ...DEFAULT_CHARACTER, accessory: choice.accessory, badge: choice.badge })}
              >
                Reset
              </button>
              <button type="button" className={styles.chunky} onClick={save} disabled={pending}>
                {saved ? "Saved" : pending ? "Saving" : "Save look"}
              </button>
            </>
          ) : (
            <button type="button" className={styles.chunky} onClick={() => switchTo("look")}>
              Customize
            </button>
          )}
        </div>
      </section>

      <section className={styles.bag} aria-label={looking ? "Look" : "Gear"}>
        <div className={styles.switcher} role="tablist" aria-label="Wardrobe">
          {[
            ["gear", "Gear"],
            ["look", "Look"],
          ].map(([code, label]) => (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={mode === code}
              className={`${styles.switch} ${mode === code ? styles.switchOn : ""}`}
              onClick={() => switchTo(code)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.bagBody}>
          {looking ? (
            <LookPanel tab={tab} setTab={setTab} choice={choice} owned={owned} set={set} preview={preview} />
          ) : (
            <GearPanel />
          )}
        </div>
      </section>
    </div>
  );
}
