import { describe, expect, it } from "vitest";
import {
  DECKS,
  START_CHIPS,
  activeHand,
  canDeal,
  canDouble,
  canSplit,
  deal,
  double,
  handValue,
  hit,
  isBlackjack,
  isOver,
  isValidGame,
  newGame,
  newShoe,
  nextRound,
  placeBet,
  settleHand,
  split,
  stand,
  standings,
} from "./rules";

// A shoe stacked from the top, padded with twos so draws never run out.
function stack(cards) {
  return [...cards, ...Array(60).fill("2C")];
}

// Deal order with one player: player, dealer, player, dealer (hole card).
function soloGame(cards, bet = 100) {
  return deal(placeBet(newGame(["me"], Math.random, stack(cards)), "me", bet));
}

function chips(game, key = "me") {
  return game.players.find((player) => player.key === key).chips;
}

describe("cards and hands", () => {
  it("builds a full shuffled shoe", () => {
    const shoe = newShoe(() => 0.5);
    expect(shoe).toHaveLength(DECKS * 52);
    expect(shoe.filter((card) => card === "AS")).toHaveLength(DECKS);
  });

  it("counts aces as 11 or 1", () => {
    expect(handValue(["AS", "6H"])).toEqual({ total: 17, soft: true });
    expect(handValue(["AS", "6H", "9D"])).toEqual({ total: 16, soft: false });
    expect(handValue(["AS", "AH", "9D"])).toEqual({ total: 21, soft: true });
    expect(handValue(["KS", "QH", "2D"])).toEqual({ total: 22, soft: false });
  });

  it("knows a blackjack, but not after a split", () => {
    expect(isBlackjack(["AS", "KH"])).toBe(true);
    expect(isBlackjack(["AS", "KH"], true)).toBe(false);
    expect(isBlackjack(["7S", "7H", "7D"])).toBe(false);
  });
});

describe("betting", () => {
  it("starts everyone with chips and needs a bet from each player", () => {
    let game = newGame(["me", "anna"]);
    expect(game.players.map((p) => p.chips)).toEqual([START_CHIPS, START_CHIPS]);
    game = placeBet(game, "me", 25);
    expect(canDeal(game)).toBe(false);
    game = placeBet(game, "anna", 5000);
    expect(game.bets.anna).toBe(START_CHIPS);
    expect(canDeal(game)).toBe(true);
  });

  it("takes the bet when the cards are dealt", () => {
    const game = soloGame(["9S", "5D", "8H", "9C"]);
    expect(chips(game)).toBe(START_CHIPS - 100);
    expect(activeHand(game).cards).toEqual(["9S", "8H"]);
    expect(game.dealer).toEqual(["5D", "9C"]);
  });
});

describe("playing a hand", () => {
  it("wins 1:1 when the dealer busts", () => {
    // Dealer 5 + 9 = 14, draws a K and busts.
    const game = stand(soloGame(["9S", "5D", "8H", "9C", "KD"]));
    expect(game.phase).toBe("done");
    expect(game.hands[0].result).toBe("win");
    expect(chips(game)).toBe(START_CHIPS + 100);
  });

  it("loses on a bust without the dealer drawing", () => {
    const game = hit(soloGame(["10S", "5D", "6H", "9C", "KD", "AH"]));
    expect(game.hands[0].result).toBe("bust");
    expect(game.dealer).toEqual(["5D", "9C"]);
    expect(chips(game)).toBe(START_CHIPS - 100);
  });

  it("pays a blackjack 3:2 and skips the turn", () => {
    const game = soloGame(["AS", "9D", "KH", "8C"]);
    expect(game.phase).toBe("done");
    expect(game.hands[0].result).toBe("blackjack");
    expect(chips(game)).toBe(START_CHIPS + 150);
  });

  it("rounds a 3:2 payout down to whole chips", () => {
    expect(settleHand({ cards: ["AS", "KH"], bet: 25, fromSplit: false }, ["9D", "8C"]).payout).toBe(62);
  });

  it("ends the round at once on a dealer blackjack, and a shared blackjack pushes", () => {
    const lost = soloGame(["9S", "AD", "8H", "KC"]);
    expect(lost.phase).toBe("done");
    expect(lost.hands[0].result).toBe("lose");
    const pushed = soloGame(["AS", "AD", "KH", "KC"]);
    expect(pushed.hands[0].result).toBe("push");
    expect(chips(pushed)).toBe(START_CHIPS);
  });

  it("dealer stands on a soft 17", () => {
    const game = stand(soloGame(["10S", "AD", "8H", "6C", "5D"]));
    expect(game.dealer).toEqual(["AD", "6C"]);
    expect(game.hands[0].result).toBe("win");
  });

  it("doubles: twice the bet, one card, then the dealer", () => {
    let game = soloGame(["6S", "6D", "5H", "10C", "10D", "9H"]);
    expect(canDouble(game)).toBe(true);
    game = double(game);
    expect(game.hands[0].cards).toEqual(["6S", "5H", "10D"]);
    expect(game.hands[0].bet).toBe(200);
    // Dealer 6 + 10 = 16, draws a 9 and busts.
    expect(game.hands[0].result).toBe("win");
    expect(chips(game)).toBe(START_CHIPS + 200);
  });

  it("splits a pair into two hands, once", () => {
    // Player 8 8, dealer 6 10; the split hands get 3 and 10.
    let game = soloGame(["8S", "6D", "8H", "10C", "3D", "10H"]);
    expect(canSplit(game)).toBe(true);
    game = split(game);
    expect(game.hands.map((h) => h.cards)).toEqual([["8S", "3D"], ["8H", "10H"]]);
    expect(chips(game)).toBe(START_CHIPS - 200);
    expect(canSplit(game)).toBe(false);
    game = stand(hit(game));
    expect(game.hands[0].cards).toHaveLength(3);
    expect(game.active).toBe(1);
  });

  it("gives split aces one card each, and 21 there is not a blackjack", () => {
    const game = split(soloGame(["AS", "9D", "AH", "8C", "KD", "9H"]));
    expect(game.phase).toBe("done");
    expect(game.hands.map((h) => h.result)).toEqual(["win", "win"]);
    expect(chips(game)).toBe(START_CHIPS + 200);
  });

  it("refuses to double or split without the chips for it", () => {
    const game = soloGame(["8S", "6D", "8H", "10C"], START_CHIPS);
    expect(canDouble(game)).toBe(false);
    expect(canSplit(game)).toBe(false);
    expect(double(game)).toBe(game);
  });
});

describe("rounds and the end", () => {
  it("plays seats in order", () => {
    // Order: me, anna, dealer, me, anna, dealer.
    let game = newGame(["me", "anna"], Math.random, stack(["9S", "10D", "5C", "8H", "9C", "10H"]));
    game = deal(placeBet(placeBet(game, "me", 10), "anna", 10));
    expect(activeHand(game).owner).toBe("me");
    game = stand(game);
    expect(activeHand(game).owner).toBe("anna");
  });

  it("keeps the last bet for the next round", () => {
    const done = stand(soloGame(["9S", "5D", "8H", "9C", "KD"], 25));
    const next = nextRound(done);
    expect(next.phase).toBe("bet");
    expect(next.round).toBe(2);
    expect(next.bets.me).toBe(25);
  });

  it("is over when nobody has chips left", () => {
    const broke = hit(soloGame(["10S", "5D", "6H", "9C", "KD"], START_CHIPS));
    expect(chips(broke)).toBe(0);
    const next = nextRound(broke);
    expect(isOver(next)).toBe(true);
    expect(standings(next)[0].chips).toBe(0);
  });

  it("accepts only a sound stored game", () => {
    expect(isValidGame(newGame(["me"]))).toBe(true);
    expect(isValidGame({ shoe: [] })).toBe(false);
    expect(isValidGame(null)).toBe(false);
  });
});
