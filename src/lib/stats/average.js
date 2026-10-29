// One rating for a player: the plain average of their ratings over every
// game they are rated in, rounded. rows: [{ rating }], ratings may be
// strings. Null without any rating.
export function averageRating(rows) {
  if (!rows.length) return null;
  return Math.round(rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length);
}
