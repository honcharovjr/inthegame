import { describe, expect, it } from "vitest";
import { yahtzeeOnline as yahtzee } from "./online";
import { emptySheet } from "./rules";

function gameWith(changes) {
  return { ...yahtzee.newGame(["a", "b", "c"]), ...changes };
}

function sheetWith(boxes) {
  const sheet = emptySheet();
  return { ...sheet, boxes: { ...sheet.boxes, ...boxes } };
}

describe("move", () => {
  it("returns the same game for a move that is not allowed", () => {
    const game = yahtzee.newGame(["a", "b"]);
    expect(yahtzee.move(game, { type: "score", category: "chance" })).toBe(game);
    expect(yahtzee.move({ ...game, rollsLeft: 0 }, { type: "roll" })).toEqual({ ...game, rollsLeft: 0 });
    expect(yahtzee.move(game, { type: "hold", index: 0 })).toBe(game);
  });

  it("keeps the dice held on the device and rolls the rest", () => {
    const game = { ...yahtzee.newGame(["a", "b"]), dice: [6, 6, 2, 3, 4], rollsLeft: 2 };
    const held = [true, true, false, false, false];
    const next = yahtzee.move(game, { type: "roll", held }, () => 0);
    expect(next.dice).toEqual([6, 6, 1, 1, 1]);
    expect(next.held).toEqual(held);
    expect(next.rollsLeft).toBe(1);
  });

  it("ignores holds on the first roll and bad holds", () => {
    const game = yahtzee.newGame(["a", "b"]);
    const first = yahtzee.move(game, { type: "roll", held: [true, true, true, true, true] }, () => 0);
    expect(first.dice).toEqual([1, 1, 1, 1, 1]);
    const later = { ...game, dice: [6, 6, 6, 6, 6], rollsLeft: 2 };
    expect(yahtzee.move(later, { type: "roll", held: ["yes"] }, () => 0).dice).toEqual([1, 1, 1, 1, 1]);
  });
});

describe("skipTurn", () => {
  it("scores the dice in the box worth the most", () => {
    const game = gameWith({ dice: [2, 3, 1, 5, 4], rollsLeft: 1 });
    const next = yahtzee.skipTurn(game, () => 0);
    expect(next.sheets.a.boxes.largeStraight).toBe(40);
    expect(next.turn).toBe(1);
  });

  it("puts a 0 in a random open box when nothing scores", () => {
    const boxes = { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18, chance: 20 };
    const game = gameWith({
      dice: [1, 2, 3, 5, 6],
      rollsLeft: 0,
      sheets: { ...gameWith({}).sheets, a: sheetWith(boxes) },
    });
    // 1, 2, 3, 5, 6 has no kind and no run, so every open box scores 0.
    const next = yahtzee.skipTurn(game, () => 0);
    const filled = Object.entries(next.sheets.a.boxes).filter(
      ([id, value]) => value !== null && !(id in boxes),
    );
    expect(filled).toEqual([["threeKind", 0]]);
  });

  it("puts a 0 in a random open box when no dice were rolled", () => {
    const game = gameWith({ dice: [6, 6, 6, 6, 6] });
    const next = yahtzee.skipTurn(game, () => 0.99);
    expect(next.sheets.a.boxes.chance).toBe(0);
    expect(next.sheets.a.boxes.yahtzee).toBeNull();
    expect(next.turn).toBe(1);
    expect(next.rollsLeft).toBe(3);
  });
});

describe("removePlayer", () => {
  it("keeps the player on turn when someone before them leaves", () => {
    const game = yahtzee.removePlayer(gameWith({ turn: 4 }), "a"); // round 2, b on turn
    expect(game.players).toEqual(["b", "c"]);
    expect(yahtzee.currentPlayer(game)).toBe("b");
    expect(game.turn).toBe(2);
    expect(game.sheets.a).toBeUndefined();
  });

  it("passes the turn on when the player on turn leaves", () => {
    const game = yahtzee.removePlayer(gameWith({ turn: 4, rollsLeft: 1 }), "b");
    expect(yahtzee.currentPlayer(game)).toBe("c");
    expect(game.rollsLeft).toBe(3);
  });

  it("starts the next round when the last player of a round leaves", () => {
    const game = yahtzee.removePlayer(gameWith({ turn: 5 }), "c");
    expect(yahtzee.currentPlayer(game)).toBe("a");
    expect(game.turn).toBe(4);
  });

  it("ends at the same total of turns for the players left", () => {
    const game = yahtzee.removePlayer(gameWith({ turn: 37 }), "c"); // last round, b on turn
    expect(yahtzee.isOver(game)).toBe(false);
    expect(yahtzee.isOver({ ...game, turn: game.turn + 1 })).toBe(true);
  });
});
