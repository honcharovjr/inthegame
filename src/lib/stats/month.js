// Statistics for the "This month" block. Definitions follow docs/rating.md:
// games played counts every session you took part in. A win is place 1 in a
// session with at least 2 participants. Win rate is wins divided by sessions
// with at least 2 participants.

// rows: one per session you played in, { place, participants }.
export function monthStats(rows) {
  const played = rows.length;
  const ranked = rows.filter((row) => row.participants >= 2);
  const wins = ranked.filter((row) => row.place === 1).length;
  const winRate =
    ranked.length > 0 ? Math.round((wins / ranked.length) * 100) : null;
  return { played, wins, winRate };
}

export function ordinal(place) {
  const mod100 = place % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  switch (place % 10) {
    case 1:
      return `${place}st`;
    case 2:
      return `${place}nd`;
    case 3:
      return `${place}rd`;
    default:
      return `${place}th`;
  }
}

// What to show next to a session in the recent list.
export function resultLabel(place, participants) {
  if (participants < 2) return "Solo";
  return place === 1 ? "Won" : ordinal(place);
}

// The first moment of the month that contains the given date, in UTC.
export function monthStartIso(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  ).toISOString();
}
