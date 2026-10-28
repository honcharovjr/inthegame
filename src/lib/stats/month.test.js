import { describe, expect, it } from "vitest";
import { monthHeadline, monthStartIso, monthStats, ordinal, resultLabel } from "./month";

describe("monthHeadline", () => {
  it("invites a first game of the month", () => {
    expect(monthHeadline({ played: 0, wins: 0, winRate: null })).toBe(
      "no games yet this month. deal the cards.",
    );
  });

  it("counts games before the first win", () => {
    expect(monthHeadline({ played: 1, wins: 0, winRate: 0 })).toBe(
      "1 game this month. the first win is close.",
    );
    expect(monthHeadline({ played: 4, wins: 0, winRate: 0 })).toMatch(/^4 games/);
  });

  it("cheers a winning month of at least 3 games", () => {
    expect(monthHeadline({ played: 4, wins: 3, winRate: 75 })).toBe(
      "3 wins this month. the table is yours.",
    );
  });

  it("keeps a short or losing month modest", () => {
    expect(monthHeadline({ played: 2, wins: 1, winRate: 50 })).toBe(
      "1 win this month. keep it rolling.",
    );
    expect(monthHeadline({ played: 5, wins: 2, winRate: 40 })).toBe(
      "2 wins this month. keep it rolling.",
    );
  });
});

describe("monthStats", () => {
  it("counts sessions, wins and win rate", () => {
    const rows = [
      { place: 1, participants: 3 },
      { place: 2, participants: 3 },
      { place: 1, participants: 2 },
      { place: 3, participants: 4 },
    ];
    expect(monthStats(rows)).toEqual({ played: 4, wins: 2, winRate: 50 });
  });

  it("rounds the win rate", () => {
    const rows = [
      { place: 1, participants: 2 },
      { place: 2, participants: 2 },
      { place: 2, participants: 2 },
    ];
    expect(monthStats(rows).winRate).toBe(33);
  });

  it("does not count a solo session as a win or in the win rate", () => {
    const rows = [
      { place: 1, participants: 1 },
      { place: 1, participants: 2 },
    ];
    expect(monthStats(rows)).toEqual({ played: 2, wins: 1, winRate: 100 });
  });

  it("has no win rate without a ranked session", () => {
    expect(monthStats([{ place: 1, participants: 1 }]).winRate).toBeNull();
    expect(monthStats([])).toEqual({ played: 0, wins: 0, winRate: null });
  });

  it("counts a shared first place as a win", () => {
    expect(monthStats([{ place: 1, participants: 3 }]).wins).toBe(1);
  });
});

describe("ordinal", () => {
  it("writes places", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(21)).toBe("21st");
  });
});

describe("resultLabel", () => {
  it("says Won for first place", () => {
    expect(resultLabel(1, 3)).toBe("Won");
  });

  it("gives other places as ordinals", () => {
    expect(resultLabel(2, 3)).toBe("2nd");
  });

  it("says Solo for one participant", () => {
    expect(resultLabel(1, 1)).toBe("Solo");
  });
});

describe("monthStartIso", () => {
  it("returns the first of the month in UTC", () => {
    expect(monthStartIso(new Date("2026-10-24T15:30:00Z"))).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });
});
