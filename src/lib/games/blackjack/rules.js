// Blackjack rules as pure functions, so they are easy to test. Each move
// takes a game and returns a new one; nothing is changed in place.
//
// Casino standard, kept simple: a 6-deck shoe, reshuffled once three quarters
// of it is used. The dealer stands on every 17. A blackjack pays 3:2 (rounded
// down to whole chips), a win 1:1, a tie returns the bet. Players may double
// on their first two cards and split a pair of the same value once. Split
// aces take one card each. No insurance and no surrender.

export const DECKS = 6;
export const START_CHIPS = 1000;
export const BETS = [10, 25, 100];
export const MAX_PLAYERS = 5;

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["S", "H", "D", "C"];
const SHOE_SIZE = DECKS * RANKS.length * SUITS.length;
// Reshuffle before a round once fewer cards than this are left.
const CUT = Math.round(SHOE_SIZE / 4);

// A card is a string: rank then suit, such as "AS" or "10H".
export function rankOf(card) {
  return card.slice(0, -1);
}

export function suitOf(card) {
  return card.slice(-1);
}

function valueOf(card) {
  const rank = rankOf(card);
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number(rank);
}

export function newShoe(random = Math.random) {
  const cards = [];
  for (let deck = 0; deck < DECKS; deck += 1) {
    for (const suit of SUITS) for (const rank of RANKS) cards.push(rank + suit);
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// The best total of a hand. soft: an ace still counts as 11.
export function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += valueOf(card);
    if (rankOf(card) === "A") aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

// Two cards making 21. A split hand making 21 is not a blackjack.
export function isBlackjack(cards, fromSplit = false) {
  return !fromSplit && cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards) {
  return handValue(cards).total > 21;
}

// keys: the players in seat order. shoe: for tests, a stacked shoe.
export function newGame(keys, random = Math.random, shoe = null) {
  return {
    shoe: shoe ?? newShoe(random),
    players: keys.map((key) => ({ key, chips: START_CHIPS })),
    phase: "bet",
    bets: {},
    hands: [],
    active: -1,
    dealer: [],
    round: 1,
  };
}

// Players who can still play: they have chips left.
export function seated(game) {
  return game.players.filter((player) => player.chips > 0);
}

export function isOver(game) {
  return game.phase === "bet" && seated(game).length === 0;
}

function chipsOf(game, key) {
  return game.players.find((player) => player.key === key)?.chips ?? 0;
}

function withChips(game, key, change) {
  return game.players.map((player) =>
    player.key === key ? { ...player, chips: player.chips + change } : player,
  );
}

// Sets a player's bet for the next round, from 0 up to all their chips.
export function placeBet(game, key, amount) {
  if (game.phase !== "bet") return game;
  const chips = chipsOf(game, key);
  const bet = Math.max(0, Math.min(Math.floor(amount), chips));
  return { ...game, bets: { ...game.bets, [key]: bet } };
}

// Every seated player has a bet, so the cards can be dealt.
export function canDeal(game) {
  const players = seated(game);
  return game.phase === "bet" && players.length > 0 && players.every((p) => (game.bets[p.key] ?? 0) > 0);
}

function draw(game) {
  const shoe = game.shoe.length > 0 ? game.shoe : newShoe();
  return { card: shoe[0], shoe: shoe.slice(1) };
}

// Deals two cards to every hand and two to the dealer, one at a time, as at
// a table. The dealer's second card stays face down until the dealer plays.
export function deal(game) {
  if (!canDeal(game)) return game;
  let next = { ...game };
  let players = next.players;
  const hands = [];
  for (const player of seated(game)) {
    const bet = game.bets[player.key];
    players = players.map((p) => (p.key === player.key ? { ...p, chips: p.chips - bet } : p));
    hands.push({ owner: player.key, cards: [], bet, doubled: false, fromSplit: false, done: false, result: null, payout: 0 });
  }
  let dealer = [];
  for (let pass = 0; pass < 2; pass += 1) {
    for (const hand of hands) {
      const { card, shoe } = draw(next);
      hand.cards.push(card);
      next = { ...next, shoe };
    }
    const { card, shoe } = draw(next);
    dealer = [...dealer, card];
    next = { ...next, shoe };
  }
  for (const hand of hands) {
    if (handValue(hand.cards).total === 21) hand.done = true;
  }
  next = { ...next, players, hands, dealer, phase: "play", active: -1 };
  // A dealer blackjack ends the round at once; the dealer checks for it.
  if (isBlackjack(dealer)) return settle({ ...next, hands: hands.map((h) => ({ ...h, done: true })) });
  return advance(next);
}

// Moves to the next hand that still has to play, or to the dealer.
function advance(game) {
  const active = game.hands.findIndex((hand) => !hand.done);
  if (active === -1) return playDealer(game);
  return { ...game, active };
}

export function activeHand(game) {
  return game.phase === "play" ? game.hands[game.active] ?? null : null;
}

function updateActive(game, change) {
  return game.hands.map((hand, index) => (index === game.active ? { ...hand, ...change } : hand));
}

export function canHit(game) {
  return Boolean(activeHand(game));
}

export function hit(game) {
  const hand = activeHand(game);
  if (!hand) return game;
  const { card, shoe } = draw(game);
  const cards = [...hand.cards, card];
  const done = handValue(cards).total >= 21;
  return advance({ ...game, shoe, hands: updateActive(game, { cards, done }) });
}

export function stand(game) {
  if (!activeHand(game)) return game;
  return advance({ ...game, hands: updateActive(game, { done: true }) });
}

export function canDouble(game) {
  const hand = activeHand(game);
  return Boolean(hand) && hand.cards.length === 2 && chipsOf(game, hand.owner) >= hand.bet;
}

// Doubles the bet, takes exactly one more card and ends the hand.
export function double(game) {
  if (!canDouble(game)) return game;
  const hand = activeHand(game);
  const { card, shoe } = draw(game);
  return advance({
    ...game,
    shoe,
    players: withChips(game, hand.owner, -hand.bet),
    hands: updateActive(game, { cards: [...hand.cards, card], bet: hand.bet * 2, doubled: true, done: true }),
  });
}

export function canSplit(game) {
  const hand = activeHand(game);
  return (
    Boolean(hand) &&
    !hand.fromSplit &&
    hand.cards.length === 2 &&
    valueOf(hand.cards[0]) === valueOf(hand.cards[1]) &&
    chipsOf(game, hand.owner) >= hand.bet
  );
}

// Splits a pair into two hands with the same bet, each getting a second
// card. Split aces get one card each and stop there.
export function split(game) {
  if (!canSplit(game)) return game;
  const hand = activeHand(game);
  let next = { ...game, players: withChips(game, hand.owner, -hand.bet) };
  const aces = rankOf(hand.cards[0]) === "A";
  const made = hand.cards.map((first) => {
    const { card, shoe } = draw(next);
    next = { ...next, shoe };
    const cards = [first, card];
    return { ...hand, cards, fromSplit: true, done: aces || handValue(cards).total === 21 };
  });
  const hands = [...game.hands.slice(0, game.active), ...made, ...game.hands.slice(game.active + 1)];
  return advance({ ...next, hands, active: -1 });
}

// The dealer draws to 17 or more, unless every hand is already lost.
function playDealer(game) {
  let next = { ...game, active: -1 };
  const live = game.hands.some((hand) => !isBust(hand.cards));
  while (live && handValue(next.dealer).total < 17) {
    const { card, shoe } = draw(next);
    next = { ...next, shoe, dealer: [...next.dealer, card] };
  }
  return settle(next);
}

// result: blackjack | win | push | lose | bust. payout: chips paid back,
// the bet included.
export function settleHand(hand, dealer) {
  const player = handValue(hand.cards).total;
  const house = handValue(dealer).total;
  const natural = isBlackjack(hand.cards, hand.fromSplit);
  const dealerNatural = isBlackjack(dealer);
  if (player > 21) return { result: "bust", payout: 0 };
  if (natural && dealerNatural) return { result: "push", payout: hand.bet };
  if (natural) return { result: "blackjack", payout: hand.bet + Math.floor(hand.bet * 1.5) };
  if (dealerNatural) return { result: "lose", payout: 0 };
  if (house > 21 || player > house) return { result: "win", payout: hand.bet * 2 };
  if (player === house) return { result: "push", payout: hand.bet };
  return { result: "lose", payout: 0 };
}

function settle(game) {
  let players = game.players;
  const hands = game.hands.map((hand) => {
    const outcome = settleHand(hand, game.dealer);
    players = players.map((p) => (p.key === hand.owner ? { ...p, chips: p.chips + outcome.payout } : p));
    return { ...hand, ...outcome, done: true };
  });
  return { ...game, players, hands, phase: "done", active: -1 };
}

// Clears the table for the next round. Bets carry over where they still fit.
export function nextRound(game, random = Math.random) {
  if (game.phase !== "done") return game;
  const bets = {};
  for (const player of game.players) {
    const last = game.hands.find((hand) => hand.owner === player.key);
    const bet = last ? Math.min(last.doubled ? last.bet / 2 : last.bet, player.chips) : 0;
    if (bet > 0) bets[player.key] = bet;
  }
  return {
    ...game,
    shoe: game.shoe.length < CUT ? newShoe(random) : game.shoe,
    phase: "bet",
    bets,
    hands: [],
    active: -1,
    dealer: [],
    round: game.round + 1,
  };
}

// Players by chips, most first, for the end of the game.
export function standings(game) {
  return [...game.players].sort((a, b) => b.chips - a.chips);
}

// A stored game that still makes sense, so a broken one is never resumed.
export function isValidGame(game) {
  return (
    Boolean(game) &&
    Array.isArray(game.shoe) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    Array.isArray(game.hands) &&
    Array.isArray(game.dealer) &&
    ["bet", "play", "done"].includes(game.phase)
  );
}
