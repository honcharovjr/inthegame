import { describe, expect, it } from "vitest";
import { countedGames, memberRatings, overallRating } from "./average";

describe("overallRating", () => {
  it("weights each game by its rated sessions", () => {
    // (1500 * 3 + 1100 * 9) / 12 = 1200
    expect(overallRating([{ rating: "1500", games_count: 3 }, { rating: 1100, games_count: "9" }])).toBe(1200);
  });

  it("leaves out games with fewer than 3 rated sessions", () => {
    expect(overallRating([{ rating: 1400, games_count: 4 }, { rating: 900, games_count: 2 }])).toBe(1400);
  });

  it("is null when no game counts", () => {
    expect(overallRating([{ rating: 1400, games_count: 2 }])).toBeNull();
    expect(overallRating([])).toBeNull();
  });

  it("rounds", () => {
    expect(overallRating([{ rating: 1512.4, games_count: 3 }])).toBe(1512);
  });
});

describe("countedGames", () => {
  it("keeps the games that count", () => {
    expect(countedGames([{ games_count: 3 }, { games_count: 1 }])).toEqual([{ games_count: 3 }]);
  });
});

describe("memberRatings", () => {
  const rows = [
    { profile_id: "a", rating: 1500, games_count: 3 },
    { profile_id: "a", rating: 1100, games_count: 9 },
    { profile_id: "b", rating: 1300, games_count: 2 },
  ];

  it("gives each player their overall rating", () => {
    expect(memberRatings(rows, false)).toEqual(new Map([["a", 1200]]));
  });

  it("gives the rating in one game", () => {
    expect(memberRatings([{ profile_id: "a", rating: 1500.6, games_count: 3 }], true)).toEqual(new Map([["a", 1501]]));
    expect(memberRatings([{ profile_id: "b", rating: 1300, games_count: 2 }], true).size).toBe(0);
  });
});
