import { describe, expect, it } from "vitest";
import { averageRating } from "./average";

describe("averageRating", () => {
  it("averages the ratings of all games, rounded", () => {
    expect(averageRating([{ rating: "1500" }, { rating: 1540.6 }, { rating: 1461 }])).toBe(1501);
  });

  it("is the rating itself for one game", () => {
    expect(averageRating([{ rating: "1512.4" }])).toBe(1512);
  });

  it("is null without ratings", () => {
    expect(averageRating([])).toBeNull();
  });
});
