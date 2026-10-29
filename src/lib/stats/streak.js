// Win streaks of one player. rows: one per session they played in,
// { place, participants, playedAt }, in any order. Solo sessions are not
// ranked, so they neither extend nor break a streak (docs/rating.md).
// Returns { current, best }: wins in a row up to the latest session, and the
// longest run ever.
export function winStreaks(rows) {
  const ranked = rows
    .filter((row) => row.participants >= 2)
    .sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));
  let current = 0;
  let best = 0;
  for (const row of ranked) {
    current = row.place === 1 ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}
