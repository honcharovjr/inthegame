import { describe, expect, it } from "vitest";
import { LINE_PATH, RATING_FROM, RATING_TO, easeOut, ratingAt, seasonActivity, seasonAt } from "./growth";

describe("seasonActivity", () => {
  it("gives one level per cell, the same for the same seed", () => {
    const a = seasonActivity(30, 4, 7);
    expect(a).toHaveLength(120);
    expect(a).toEqual(seasonActivity(30, 4, 7));
    expect(a.every((v) => v >= 0 && v <= 4)).toBe(true);
  });

  it("is not empty and not full", () => {
    const played = seasonActivity().filter(Boolean).length;
    expect(played).toBeGreaterThan(15);
    expect(played).toBeLessThan(90);
  });

  it("plays more on the weekend cells", () => {
    const a = seasonActivity();
    const weekend = a.filter((v, i) => i % 4 >= 2 && v).length;
    const week = a.filter((v, i) => i % 4 < 2 && v).length;
    expect(weekend).toBeGreaterThan(week);
  });
});

describe("ratingAt", () => {
  it("starts and ends at the demo ratings", () => {
    expect(ratingAt(0)).toBe(RATING_FROM);
    expect(ratingAt(1)).toBe(RATING_TO);
  });

  it("dips where the line dips", () => {
    // The line drops between its 2nd and 3rd point.
    expect(ratingAt(0.2)).toBeLessThan(ratingAt(0.1));
  });

  it("stays in range outside 0 to 1", () => {
    expect(ratingAt(-1)).toBe(RATING_FROM);
    expect(ratingAt(2)).toBe(RATING_TO);
  });
});

describe("seasonAt", () => {
  it("reaches whole weeks and counts their games", () => {
    const levels = [0, 1, 0, 2, 1, 0, 0, 0];
    expect(seasonAt(levels, 0)).toEqual({ reached: 0, games: 0 });
    expect(seasonAt(levels, 0.5)).toEqual({ reached: 4, games: 2 });
    expect(seasonAt(levels, 1)).toEqual({ reached: 8, games: 3 });
  });
});

describe("helpers", () => {
  it("eases out and clamps", () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });

  it("draws the line from its points", () => {
    expect(LINE_PATH.startsWith("M0 140 L60 128")).toBe(true);
  });
});
