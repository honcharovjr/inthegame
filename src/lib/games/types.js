// Game types as stored in the database, with their label and colour tone.
export const GAME_TYPES = [
  { value: "board", label: "Board", tone: "lemon" },
  { value: "card", label: "Card", tone: "coral" },
  { value: "dice", label: "Dice", tone: "primary" },
  { value: "dominoes", label: "Dominoes", tone: "sky" },
  { value: "party", label: "Party", tone: "violet" },
  { value: "other", label: "Other", tone: "default" },
];

export function findGameType(value) {
  return GAME_TYPES.find((type) => type.value === value) ?? GAME_TYPES[5];
}
