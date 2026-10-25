import { describe, expect, it } from "vitest";
import {
  applyTiebreak,
  placesFromOrder,
  placesFromScores,
  placesFromWinner,
  validatePlaces,
} from "./places";

describe("placesFromWinner", () => {
  it("gives the winner place 1 and everyone else place 2", () => {
    expect(placesFromWinner(["a", "b", "c"], "b")).toEqual({
      a: 2,
      b: 1,
      c: 2,
    });
  });

  it("rejects a winner who did not play", () => {
    expect(() => placesFromWinner(["a", "b"], "z")).toThrow();
  });
});

describe("placesFromScores", () => {
  it("ranks higher scores first", () => {
    expect(placesFromScores({ a: 3, b: 10, c: 7 })).toEqual({
      a: 3,
      b: 1,
      c: 2,
    });
  });

  it("ties equal scores and skips the next place", () => {
    expect(placesFromScores({ a: 10, b: 7, c: 7, d: 3 })).toEqual({
      a: 1,
      b: 2,
      c: 2,
      d: 4,
    });
  });

  it("ties everyone when all scores are equal", () => {
    expect(placesFromScores({ a: 5, b: 5 })).toEqual({ a: 1, b: 1 });
  });

  it("handles negative scores", () => {
    expect(placesFromScores({ a: -2, b: 0 })).toEqual({ a: 2, b: 1 });
  });
});

describe("validatePlaces", () => {
  it("accepts a normal ranking", () => {
    const places = { a: 1, b: 2, c: 3 };
    expect(validatePlaces(places)).toBe(places);
  });

  it("accepts a tie for first place", () => {
    expect(() => validatePlaces({ a: 1, b: 1, c: 3 })).not.toThrow();
  });

  it("rejects places without a first place", () => {
    expect(() => validatePlaces({ a: 2, b: 3 })).toThrow();
  });

  it("rejects places above the number of players", () => {
    expect(() => validatePlaces({ a: 1, b: 5 })).toThrow();
  });

  it("rejects fractions", () => {
    expect(() => validatePlaces({ a: 1, b: 1.5 })).toThrow();
  });

  it("rejects an empty ranking", () => {
    expect(() => validatePlaces({})).toThrow();
  });
});

describe("placesFromOrder", () => {
  it("gives places by position", () => {
    expect(placesFromOrder(["a", "b", "c"])).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("lets a tied player share the place above", () => {
    expect(placesFromOrder(["a", "b", "c", "d"], { c: true })).toEqual({
      a: 1,
      b: 2,
      c: 2,
      d: 4,
    });
  });

  it("chains ties", () => {
    expect(placesFromOrder(["a", "b", "c"], { b: true, c: true })).toEqual({
      a: 1,
      b: 1,
      c: 1,
    });
  });

  it("ignores a tie flag on the first player", () => {
    expect(placesFromOrder(["a", "b"], { a: true })).toEqual({ a: 1, b: 2 });
  });
});

describe("applyTiebreak", () => {
  it("lets the chosen leader take place 1 and moves the other leaders to 2", () => {
    expect(applyTiebreak({ a: 1, b: 1, c: 3 }, "b")).toEqual({
      a: 2,
      b: 1,
      c: 3,
    });
  });

  it("works with three leaders", () => {
    expect(applyTiebreak({ a: 1, b: 1, c: 1 }, "c")).toEqual({
      a: 2,
      b: 2,
      c: 1,
    });
  });

  it("rejects a player who is not a leader", () => {
    expect(() => applyTiebreak({ a: 1, b: 1, c: 3 }, "c")).toThrow();
  });
});
