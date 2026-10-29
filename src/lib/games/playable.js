// Games that can be played inside the app. catalogName links a game to its
// row in the catalog, for when results are saved as sessions later.
export const PLAYABLE_GAMES = [
  {
    slug: "yahtzee",
    name: "Yahtzee",
    catalogName: "Yahtzee",
    href: "/play/yahtzee",
    minPlayers: 1,
    maxPlayers: 6,
    blurb: "Roll five dice up to three times and fill 13 boxes. Highest total wins.",
  },
  {
    slug: "blackjack",
    name: "Blackjack",
    catalogName: "Blackjack",
    href: "/play/blackjack",
    minPlayers: 1,
    maxPlayers: 5,
    blurb: "Beat the dealer to 21 without going over. Bet chips, double down, split pairs.",
  },
];

export function findPlayable(slug) {
  return PLAYABLE_GAMES.find((game) => game.slug === slug) ?? null;
}
