// Games that can be played inside the app. catalogName links a game to its
// row in the catalog, so a finished game is saved as a session of that game.
export const PLAYABLE_GAMES = [
  {
    slug: "yahtzee",
    name: "Yahtzee",
    catalogName: "Yahtzee",
    href: "/play/yahtzee",
    minPlayers: 2,
    maxPlayers: 6,
    blurb: "Roll five dice up to three times and fill 13 boxes. Highest total wins.",
  },
];

export function findPlayable(slug) {
  return PLAYABLE_GAMES.find((game) => game.slug === slug) ?? null;
}
