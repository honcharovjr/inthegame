// The emoji on a game tile. Players type their own for a custom game. A game
// with none gets a default for its type.
const TYPE_DEFAULTS = {
  board: "♟️",
  card: "🃏",
  dice: "🎲",
  tile: "🀄",
  party: "🎉",
  other: "🎮",
};

export function gameEmoji(game) {
  return game?.emoji || TYPE_DEFAULTS[game?.type] || "🎮";
}

const PICTOGRAPH = /\p{Extended_Pictographic}/u;

// Splits text into what a person sees as single characters.
function graphemes(text) {
  return [...new Intl.Segmenter().segment(text)].map((part) => part.segment);
}

// True for exactly one emoji, such as a flag or a family, and nothing else.
export function isSingleEmoji(text) {
  const value = String(text ?? "");
  return value.length <= 8 && graphemes(value).length === 1 && PICTOGRAPH.test(value);
}

// The last emoji in whatever was typed or pasted, or "" when there is none.
// The last one wins, so typing a new emoji replaces the old one.
export function lastEmoji(text) {
  const found = graphemes(String(text ?? "")).filter((part) => PICTOGRAPH.test(part));
  return found.length ? found[found.length - 1] : "";
}
