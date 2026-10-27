// The parts of a character, as in docs/character.md. Free items are open from
// the first day. An item with unlockedBy needs that achievement (a code from
// src/lib/achievements/catalog.js). New items are new entries here, with no
// migration: the database only stores the chosen codes.

export const RACES = [
  { code: "human", label: "Human" },
  { code: "elf", label: "Elf" },
  { code: "dwarf", label: "Dwarf" },
  { code: "orc", label: "Orc" },
  { code: "tiefling", label: "Tiefling" },
];

export const SKINS = [
  { code: "porcelain", label: "Porcelain", hex: "#f6dccb" },
  { code: "fair", label: "Fair", hex: "#eec3a3" },
  { code: "olive", label: "Olive", hex: "#d2a47a" },
  { code: "tan", label: "Tan", hex: "#b88159" },
  { code: "brown", label: "Brown", hex: "#8f5f40" },
  { code: "deep", label: "Deep", hex: "#64412d" },
  { code: "moss", label: "Moss", hex: "#93ad6e" },
  { code: "ash", label: "Ash", hex: "#a9adbb" },
  { code: "ember", label: "Ember", hex: "#b9555f" },
  { code: "dusk", label: "Dusk", hex: "#8e70ae" },
];

// layer: the art file in public/character/ for that choice, null for none.
export const HAIRSTYLES = [
  { code: "none", label: "Bald", layer: null },
  { code: "short", label: "Short", layer: "hair-short" },
  { code: "long", label: "Long", layer: "hair-long" },
  { code: "topknot", label: "Topknot", layer: "hair-topknot" },
  { code: "braids", label: "Braids", layer: "hair-braids" },
  { code: "mohawk", label: "Mohawk", layer: "hair-mohawk" },
];

export const BEARDS = [
  { code: "none", label: "None", layer: null },
  { code: "short", label: "Short", layer: "beard-short" },
  { code: "long", label: "Long", layer: "beard-long" },
  { code: "braided", label: "Braided", layer: "beard-braided" },
  { code: "goatee", label: "Goatee", layer: "beard-goatee" },
  { code: "moustache", label: "Moustache", layer: "beard-moustache" },
];

export const HAIR_COLORS = [
  { code: "black", label: "Black", hex: "#3a3438" },
  { code: "dark-brown", label: "Dark brown", hex: "#5a3c2c" },
  { code: "brown", label: "Brown", hex: "#8a5a3a" },
  { code: "auburn", label: "Auburn", hex: "#a5442c" },
  { code: "ginger", label: "Ginger", hex: "#d46a2c" },
  { code: "blonde", label: "Blonde", hex: "#e9cc8a" },
  { code: "platinum", label: "Platinum", hex: "#f1ead8" },
  { code: "grey", label: "Grey", hex: "#b9b8bd" },
  { code: "ice", label: "Ice", hex: "#9fd4e8" },
  { code: "violet", label: "Violet", hex: "#9a6fd0" },
];

export const EYE_COLORS = [
  { code: "brown", label: "Brown", hex: "#6b4128" },
  { code: "hazel", label: "Hazel", hex: "#8f7034" },
  { code: "green", label: "Green", hex: "#4f8a4a" },
  { code: "blue", label: "Blue", hex: "#4a7fc0" },
  { code: "grey", label: "Grey", hex: "#7f8a96" },
  { code: "amber", label: "Amber", hex: "#d79a22" },
  { code: "red", label: "Red", hex: "#c0303a" },
  { code: "violet", label: "Violet", hex: "#8a55c8" },
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

// perk: a cosmetic effect, drawn by the Character component. The accessories
// themselves are not drawn on the figures until their art exists.
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
  race: "human",
  skin: "fair",
  hair: "short",
  hairColor: "brown",
  beard: "none",
  eyeColor: "brown",
  background: "cream",
  accessory: null,
  badge: null,
};

// The parts every character has, with the label used in messages.
const PARTS = [
  ["race", RACES, "race"],
  ["skin", SKINS, "skin tone"],
  ["hair", HAIRSTYLES, "hairstyle"],
  ["hairColor", HAIR_COLORS, "hair colour"],
  ["beard", BEARDS, "beard"],
  ["eyeColor", EYE_COLORS, "eye colour"],
  ["background", BACKGROUNDS, "background"],
];

const find = (list, code) => list.find((item) => item.code === code) ?? null;

export const findAccessory = (code) => find(ACCESSORIES, code);
export const findBackground = (code) => find(BACKGROUNDS, code);
export const findItem = (part, code) => find(PARTS.find(([p]) => p === part)?.[1] ?? [], code);

// earned: a Set of achievement codes
export function isUnlocked(item, earned) {
  return !item.unlockedBy || earned.has(item.unlockedBy);
}

// The character to draw: every part falls back to its default when it is
// missing or unknown, so an old saved choice (like the first blob creatures)
// never breaks a page.
export function resolveCharacter(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const character = {};
  for (const [part, list] of PARTS) {
    character[part] = find(list, value[part]) ? value[part] : DEFAULT_CHARACTER[part];
  }
  character.accessory = find(ACCESSORIES, value.accessory) ? value.accessory : null;
  character.badge = typeof value.badge === "string" ? value.badge : null;
  return character;
}

// Checks a choice before it is saved. Every part must exist, and an earned
// item must really be earned. Returns { character } or { error }.
export function validateCharacter(input, earned) {
  const value = input && typeof input === "object" ? input : {};
  const character = {};

  for (const [part, list, label] of PARTS) {
    const item = find(list, value[part]);
    if (!item) return { error: `Pick a ${label}.` };
    if (!isUnlocked(item, earned)) return { error: `The ${item.label} ${label} is still locked.` };
    character[part] = item.code;
  }
  character.accessory = null;
  character.badge = null;

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
