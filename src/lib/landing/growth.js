// The "watch it grow" demo on the landing page: a made-up season of play and
// a rating line, driven by one progress value from 0 to 1. Pure, so tested.

// The rating line from start to end, as y in a 600 x 160 box (smaller is higher).
export const LINE_Y = [140, 128, 132, 110, 98, 104, 80, 66, 70, 40, 22];
export const LINE_PATH = LINE_Y.map((y, i) => `${i ? "L" : "M"}${i * 60} ${y}`).join(" ");
export const RATING_FROM = 1480;
export const RATING_TO = 1634;

// A season of game nights: `columns` weeks of `rows` cells, the last cells of
// a week being the weekend. Some weeks run hot, some go quiet. Returns the
// level of each cell, 0 (no game) to 4, column by column. The seed keeps it
// the same on the server and in the browser.
export function seasonActivity(columns = 30, rows = 4, seed = 7) {
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  const levels = [];
  for (let column = 0; column < columns; column += 1) {
    const mood = random() < 0.2 ? 0.3 : random() < 0.3 ? 1.7 : 1;
    for (let row = 0; row < rows; row += 1) {
      const weekend = row >= rows - 2;
      const chance = (weekend ? 0.55 : 0.16) * mood;
      levels.push(random() < chance ? 1 + Math.min(3, Math.floor(random() * random() * 4 + (weekend ? 1 : 0))) : 0);
    }
  }
  return levels;
}

// Eases the progress out, so the line slows down as it reaches the top.
export function easeOut(t) {
  const p = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - p, 3);
}

// The rating at a point of the line, p from 0 to 1 along it, read off the
// line's own height so the number climbs and dips with it.
export function ratingAt(p) {
  const x = Math.min(1, Math.max(0, p)) * (LINE_Y.length - 1);
  const k = Math.min(LINE_Y.length - 2, Math.floor(x));
  const y = LINE_Y[k] + (LINE_Y[k + 1] - LINE_Y[k]) * (x - k);
  const share = (LINE_Y[0] - y) / (LINE_Y[0] - LINE_Y[LINE_Y.length - 1]);
  return Math.round(RATING_FROM + share * (RATING_TO - RATING_FROM));
}

// How many cells of the season are reached at p, and how many games they hold.
export function seasonAt(levels, p, rows = 4) {
  const columns = levels.length / rows;
  const reached = Math.floor(Math.min(1, Math.max(0, p)) * columns + 1e-9) * rows;
  const games = levels.slice(0, reached).filter(Boolean).length;
  return { reached, games };
}
