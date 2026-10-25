// Game types as stored in the database, with their label and colour tone.
export const GAME_TYPES = [
  { value: "board", label: "Board", tone: "yellow" },
  { value: "card", label: "Card", tone: "pink" },
  { value: "dice", label: "Dice", tone: "turquoise" },
  { value: "dominoes", label: "Dominoes", tone: "violet" },
  { value: "party", label: "Party", tone: "pink" },
  { value: "other", label: "Other", tone: "default" },
];

export function findGameType(value) {
  return GAME_TYPES.find((type) => type.value === value) ?? GAME_TYPES[5];
}
