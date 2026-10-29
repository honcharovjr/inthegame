// Gear: six slots around the character, separate from its look. Not built yet
// (change C20): there are no tables for it, so every item here is a mock that
// shows the idea on the profile and stays locked.
export const GEAR_SLOTS = [
  { code: "hat", label: "Hat" },
  { code: "earrings", label: "Earrings" },
  { code: "amulet", label: "Amulet" },
  { code: "gloves", label: "Gloves" },
  { code: "ring", label: "Ring" },
  { code: "weapon", label: "Weapon" },
];

// tone: the colour of the item tile.
export const MOCK_GEAR = [
  { slot: "hat", name: "Feathered cap", tone: "pink" },
  { slot: "hat", name: "Wizard hat", tone: "violet" },
  { slot: "hat", name: "Iron helm", tone: "ink" },
  { slot: "earrings", name: "Pearl drops", tone: "turquoise" },
  { slot: "earrings", name: "Gold hoops", tone: "yellow" },
  { slot: "earrings", name: "Dice studs", tone: "pink" },
  { slot: "amulet", name: "Lucky coin", tone: "yellow" },
  { slot: "amulet", name: "D20 pendant", tone: "violet" },
  { slot: "amulet", name: "Moonstone", tone: "turquoise" },
  { slot: "gloves", name: "Card shark gloves", tone: "ink" },
  { slot: "gloves", name: "Leather gloves", tone: "pink" },
  { slot: "gloves", name: "Gauntlets", tone: "violet" },
  { slot: "ring", name: "Signet ring", tone: "yellow" },
  { slot: "ring", name: "Ruby ring", tone: "pink" },
  { slot: "ring", name: "Token ring", tone: "turquoise" },
  { slot: "weapon", name: "Short sword", tone: "ink" },
  { slot: "weapon", name: "Magic wand", tone: "violet" },
  { slot: "weapon", name: "Longbow", tone: "turquoise" },
];
