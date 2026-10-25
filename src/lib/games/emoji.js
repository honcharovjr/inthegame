// The emojis a player can pick for a custom game, and the fallback for a
// game that has none.
export const GAME_EMOJIS = [
  "♟️", "🎲", "🃏", "🎯", "🧩", "🕵️", "🎴", "🀄",
  "🎳", "🏰", "⚔️", "🚀", "🧠", "🔤", "🐉", "🌍",
  "🎪", "🎭", "🍀", "💎", "🏆", "🔥", "⭐", "🎈",
];

const TYPE_DEFAULTS = {
  board: "♟️",
  card: "🃏",
  dice: "🎲",
  dominoes: "🀄",
  party: "🎉",
  other: "🎮",
};

export function gameEmoji(game) {
  return game?.emoji || TYPE_DEFAULTS[game?.type] || "🎮";
}
