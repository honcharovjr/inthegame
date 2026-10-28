import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  currentPlayer,
  emptySheet,
  finalScores,
  isOver,
  isValidGame,
  newGame,
  options,
  roll,
  round,
  score,
  scoreFor,
  scoreSheet,
  toggleHold,
  totals,
} from "./rules";

// A random source that yields the given faces in order.
function faces(...list) {
  let index = 0;
  return () => (list[index++ % list.length] - 1) / 6;
}

function sheetWith(boxes, yahtzeeBonus = 0) {
  const sheet = emptySheet();
  return { boxes: { ...sheet.boxes, ...boxes }, yahtzeeBonus };
}

describe("scoreFor", () => {
  it("counts only the matching faces in the upper section", () => {
    expect(scoreFor("threes", [3, 3, 1, 3, 6])).toBe(9);
    expect(scoreFor("sixes", [1, 2, 3, 4, 5])).toBe(0);
  });

  it("scores kinds as the sum of all dice", () => {
    expect(scoreFor("threeKind", [4, 4, 4, 2, 1])).toBe(15);
    expect(scoreFor("threeKind", [4, 4, 3, 2, 1])).toBe(0);
    expect(scoreFor("fourKind", [5, 5, 5, 5, 2])).toBe(22);
    expect(scoreFor("fourKind", [5, 5, 5, 2, 2])).toBe(0);
  });

  it("scores a full house only for three plus two", () => {
    expect(scoreFor("fullHouse", [2, 2, 3, 3, 3])).toBe(25);
    expect(scoreFor("fullHouse", [2, 2, 3, 3, 4])).toBe(0);
    expect(scoreFor("fullHouse", [6, 6, 6, 6, 6])).toBe(0);
  });

  it("finds straights in any order", () => {
    expect(scoreFor("smallStraight", [4, 1, 3, 2, 6])).toBe(30);
    expect(scoreFor("smallStraight", [3, 4, 5, 6, 6])).toBe(30);
    expect(scoreFor("smallStraight", [1, 2, 3, 5, 6])).toBe(0);
    expect(scoreFor("largeStraight", [5, 3, 2, 4, 6])).toBe(40);
    expect(scoreFor("largeStraight", [1, 2, 3, 4, 6])).toBe(0);
  });

  it("scores Yahtzee and chance", () => {
    expect(scoreFor("yahtzee", [2, 2, 2, 2, 2])).toBe(50);
    expect(scoreFor("yahtzee", [2, 2, 2, 2, 1])).toBe(0);
    expect(scoreFor("chance", [1, 2, 3, 4, 6])).toBe(16);
  });
});

describe("options and the joker rule", () => {
  it("offers every open box with its points", () => {
    const result = options(sheetWith({ chance: 20 }), [1, 1, 1, 2, 2]);
    expect(Object.keys(result)).toHaveLength(CATEGORIES.length - 1);
    expect(result.fullHouse).toBe(25);
    expect(result.ones).toBe(3);
  });

  it("allows a zero in any open box", () => {
    expect(options(emptySheet(), [1, 2, 3, 5, 6]).yahtzee).toBe(0);
  });

  it("forces the matching upper box for a second Yahtzee", () => {
    const result = options(sheetWith({ yahtzee: 50 }), [4, 4, 4, 4, 4]);
    expect(result).toEqual({ fours: 20 });
  });

  it("gives full value in the lower boxes when the upper box is used", () => {
    const result = options(sheetWith({ yahtzee: 50, fours: 12 }), [4, 4, 4, 4, 4]);
    expect(result.fullHouse).toBe(25);
    expect(result.smallStraight).toBe(30);
    expect(result.largeStraight).toBe(40);
    expect(result.chance).toBe(20);
    expect(result.ones).toBeUndefined();
  });

  it("takes a zero in an upper box when the lower section is full", () => {
    const lowerFull = {
      threeKind: 10, fourKind: 0, fullHouse: 25, smallStraight: 30,
      largeStraight: 40, yahtzee: 50, chance: 20, fours: 8,
    };
    const result = options(sheetWith(lowerFull), [4, 4, 4, 4, 4]);
    expect(result).toEqual({ ones: 0, twos: 0, threes: 0, fives: 0, sixes: 0 });
  });

  it("uses the joker after a zeroed Yahtzee box too", () => {
    const result = options(sheetWith({ yahtzee: 0, sixes: 18 }), [6, 6, 6, 6, 6]);
    expect(result.fullHouse).toBe(25);
  });
});

describe("scoreSheet and totals", () => {
  it("adds a 100 bonus for a second Yahtzee after a scored 50", () => {
    const sheet = scoreSheet(sheetWith({ yahtzee: 50 }), "fives", [5, 5, 5, 5, 5]);
    expect(sheet.boxes.fives).toBe(25);
    expect(sheet.yahtzeeBonus).toBe(1);
  });

  it("gives no bonus when the Yahtzee box holds a zero", () => {
    const sheet = scoreSheet(sheetWith({ yahtzee: 0 }), "fives", [5, 5, 5, 5, 5]);
    expect(sheet.yahtzeeBonus).toBe(0);
  });

  it("refuses a filled box", () => {
    expect(() => scoreSheet(sheetWith({ chance: 10 }), "chance", [1, 2, 3, 4, 5])).toThrow();
  });

  it("adds the upper bonus from 63", () => {
    const sheet = sheetWith({ ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 });
    expect(totals(sheet)).toMatchObject({ upper: 63, upperBonus: 35, total: 98 });
    const short = sheetWith({ ones: 2, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 });
    expect(totals(short).upperBonus).toBe(0);
  });

  it("counts the best possible game as 1575", () => {
    const sheet = sheetWith(
      {
        ones: 5, twos: 10, threes: 15, fours: 20, fives: 25, sixes: 30,
        threeKind: 30, fourKind: 30, fullHouse: 25, smallStraight: 30,
        largeStraight: 40, yahtzee: 50, chance: 30,
      },
      12,
    );
    expect(totals(sheet).total).toBe(1575);
  });
});

describe("turns", () => {
  it("rolls all dice first, then only the free ones", () => {
    let game = newGame(["a"]);
    game = roll(game, faces(1, 2, 3, 4, 5));
    expect(game.dice).toEqual([1, 2, 3, 4, 5]);
    expect(game.rollsLeft).toBe(2);
    game = toggleHold(game, 0);
    game = toggleHold(game, 4);
    game = roll(game, faces(6));
    expect(game.dice).toEqual([1, 6, 6, 6, 5]);
  });

  it("stops after three rolls and blocks holding before the first", () => {
    let game = newGame(["a"]);
    expect(toggleHold(game, 0)).toBe(game);
    game = roll(roll(roll(game, faces(2)), faces(3)), faces(4));
    expect(game.rollsLeft).toBe(0);
    expect(roll(game, faces(5))).toBe(game);
  });

  it("refuses to score before rolling", () => {
    expect(() => score(newGame(["a"]), "chance")).toThrow();
  });

  it("passes the turn and frees the dice after scoring", () => {
    let game = newGame(["a", "b"]);
    game = toggleHold(roll(game, faces(3)), 2);
    game = score(game, "threes");
    expect(game.sheets.a.boxes.threes).toBe(15);
    expect(currentPlayer(game)).toBe("b");
    expect(game.held).toEqual([false, false, false, false, false]);
    expect(game.rollsLeft).toBe(3);
    expect(round(game)).toBe(1);
  });

  it("ends after 13 rounds for every player", () => {
    let game = newGame(["a", "b"]);
    for (let turn = 0; turn < 26; turn += 1) {
      expect(isOver(game)).toBe(false);
      game = roll(game, faces(1, 2, 3, 4, 6));
      game = score(game, Object.keys(options(game.sheets[currentPlayer(game)], game.dice))[0]);
    }
    expect(isOver(game)).toBe(true);
    expect(round(game)).toBe(13);
    expect(finalScores(game)).toEqual({
      a: totals(game.sheets.a).total,
      b: totals(game.sheets.b).total,
    });
  });

  it("checks a saved game", () => {
    expect(isValidGame(newGame(["a"]))).toBe(true);
    expect(isValidGame(null)).toBe(false);
    expect(isValidGame({ players: ["a"], sheets: {} })).toBe(false);
  });
});
