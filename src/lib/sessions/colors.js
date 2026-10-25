// Colours for the players of one session. They all read well on white rows
// and on the pink, yellow and turquoise screens. The first is always you.
export const PLAYER_COLORS = [
  "#120a1a",
  "#2fd6d6",
  "#7a4cff",
  "#ff8a3d",
  "#12a150",
  "#e0368b",
];

export function playerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
