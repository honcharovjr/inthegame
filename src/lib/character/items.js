// The parts of a character, as in docs/character.md. Free items are open from
// the first day. An item with unlockedBy needs that achievement (a code from
// src/lib/achievements/catalog.js). New items are new entries here, with no
// migration: the database only stores the chosen codes.

export const BODIES = [
  { code: "round", label: "Round" },
  { code: "squircle", label: "Squircle" },
  { code: "tall", label: "Tall" },
  { code: "wobbly", label: "Wobbly" },
  { code: "droplet", label: "Droplet" },
];

export const COLORS = [
  { code: "pink", label: "Pink", hex: "#ff4fa3" },
  { code: "turquoise", label: "Turquoise", hex: "#2fd6d6" },
  { code: "yellow", label: "Yellow", hex: "#ffe14d" },
  { code: "violet", label: "Violet", hex: "#8f7bff" },
  { code: "coral", label: "Coral", hex: "#ff7a59" },
  { code: "mint", label: "Mint", hex: "#5fe0a1" },
  { code: "sky", label: "Sky", hex: "#5ab6ff" },
  { code: "lime", label: "Lime", hex: "#b8e04a" },
  { code: "orange", label: "Orange", hex: "#ffa23a" },
  { code: "lilac", label: "Lilac", hex: "#d6a8ff" },
];

export const EYES = [
  { code: "dots", label: "Dots" },
  { code: "wide", label: "Wide" },
  { code: "sleepy", label: "Sleepy" },
  { code: "happy", label: "Happy" },
  { code: "wink", label: "Wink" },
];

export const MOUTHS = [
  { code: "smile", label: "Smile" },
  { code: "grin", label: "Grin" },
  { code: "flat", label: "Flat" },
  { code: "open", label: "Open" },
  { code: "tongue", label: "Tongue" },
];

// kind: plain colour or a pattern drawn over a colour
export const BACKGROUNDS = [
  { code: "cream", label: "Cream", kind: "plain", fill: "#fff3e0" },
  { code: "blush", label: "Blush", kind: "plain", fill: "#ffe0ef" },
  { code: "aqua", label: "Aqua", kind: "plain", fill: "#dff8f8" },
  { code: "butter", label: "Butter", kind: "plain", fill: "#fff6c2" },
  { code: "haze", label: "Haze", kind: "plain", fill: "#e6e0ff" },
  { code: "dots", label: "Dots", kind: "dots", fill: "#ffe0ef", ink: "#ff9ac8" },
  { code: "stripes", label: "Stripes", kind: "stripes", fill: "#dff8f8", ink: "#8fe3e3" },
  { code: "rings", label: "Rings", kind: "rings", fill: "#fff6c2", ink: "#ffd83d" },
  { code: "confetti", label: "Confetti", kind: "confetti", fill: "#e6e0ff", ink: "#8f7bff", unlockedBy: "winners-circle" },
  { code: "zigzag", label: "Zigzag", kind: "zigzag", fill: "#dff8f8", ink: "#2fd6d6", unlockedBy: "globetrotter" },
  { code: "stars", label: "Stars", kind: "stars", fill: "#2b1d4a", ink: "#ffe14d", unlockedBy: "centurion" },
  { code: "checker", label: "Checker", kind: "checker", fill: "#ffe0ef", ink: "#ff4fa3", unlockedBy: "weekly-habit" },
];

// perk: a cosmetic effect, drawn by the Character component
export const ACCESSORIES = [
  { code: "party-hat", label: "Party Hat", unlockedBy: "regular", perk: "confetti", perkText: "Confetti burst when the profile opens" },
  { code: "round-glasses", label: "Round Glasses", unlockedBy: "explorer", perk: "shine", perkText: "A shine sweeps across the lenses" },
  { code: "bow-tie", label: "Bow Tie", unlockedBy: "not-alone", perk: "bounce", perkText: "A small bounce on hover" },
  { code: "headband", label: "Headband", unlockedBy: "hot-hand", perk: "glow", perkText: "A soft warm glow" },
  { code: "headphones", label: "Headphones", unlockedBy: "marathon", perk: "sway", perkText: "Sways gently" },
  { code: "laurel-wreath", label: "Laurel Wreath", unlockedBy: "champion", perk: "ring", perkText: "A gold ring around the avatar, even in lists" },
  { code: "cape", label: "Cape", unlockedBy: "giant-slayer", perk: "swoosh", perkText: "A swoosh when the profile opens" },
  { code: "captain-hat", label: "Captain Hat", unlockedBy: "team-champion", perk: "gradient-name", perkText: "The name gets a gradient" },
  { code: "star-crown", label: "Star Crown", unlockedBy: "dynasty", perk: "sparkle", perkText: "Sparkles around the character" },
  { code: "monocle", label: "Monocle", unlockedBy: "elite", perk: "gold-name", perkText: "A slow gleam and a gold name tag" },
];

export const DEFAULT_CHARACTER = {
  body: "round",
  color: "pink",
  eyes: "dots",
  mouth: "smile",
  background: "cream",
  accessory: null,
  badge: null,
};

const find = (list, code) => list.find((item) => item.code === code) ?? null;

export const findAccessory = (code) => find(ACCESSORIES, code);
export const findBackground = (code) => find(BACKGROUNDS, code);
export const findColor = (code) => find(COLORS, code);

// earned: a Set of achievement codes
export function isUnlocked(item, earned) {
  return !item.unlockedBy || earned.has(item.unlockedBy);
}

// The character to draw: every part falls back to its default when it is
// missing or unknown, so an old saved choice never breaks a page.
export function resolveCharacter(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const pick = (list, code, fallback) => (find(list, code) ? code : fallback);
  return {
    body: pick(BODIES, value.body, DEFAULT_CHARACTER.body),
    color: pick(COLORS, value.color, DEFAULT_CHARACTER.color),
    eyes: pick(EYES, value.eyes, DEFAULT_CHARACTER.eyes),
    mouth: pick(MOUTHS, value.mouth, DEFAULT_CHARACTER.mouth),
    background: pick(BACKGROUNDS, value.background, DEFAULT_CHARACTER.background),
    accessory: find(ACCESSORIES, value.accessory) ? value.accessory : null,
    badge: typeof value.badge === "string" ? value.badge : null,
  };
}

// Checks a choice before it is saved. Every part must exist, and an earned
// item must really be earned. Returns { character } or { error }.
export function validateCharacter(input, earned) {
  const value = input && typeof input === "object" ? input : {};
  const parts = [
    ["body", BODIES, "body shape"],
    ["color", COLORS, "colour"],
    ["eyes", EYES, "eyes"],
    ["mouth", MOUTHS, "mouth"],
    ["background", BACKGROUNDS, "background"],
  ];
  const character = { accessory: null, badge: null };

  for (const [part, list, label] of parts) {
    const item = find(list, value[part]);
    if (!item) return { error: `Pick a ${label}.` };
    if (!isUnlocked(item, earned)) return { error: `The ${item.label} ${label} is still locked.` };
    character[part] = item.code;
  }

  if (value.accessory) {
    const item = find(ACCESSORIES, value.accessory);
    if (!item) return { error: "Unknown accessory." };
    if (!isUnlocked(item, earned)) return { error: `The ${item.label} is still locked.` };
    character.accessory = item.code;
  }
  if (value.badge) {
    if (!earned.has(value.badge)) return { error: "You can only wear a badge you have earned." };
    character.badge = value.badge;
  }
  return { character };
}

// How the name of a player is drawn, from their accessory. "" for the plain name.
export function nameStyle(raw) {
  const perk = findAccessory(raw?.accessory)?.perk;
  if (perk === "gradient-name") return "name-gradient";
  if (perk === "gold-name") return "name-gold";
  return "";
}
