import { describe, expect, it } from "vitest";
import { teamLeaderboard } from "./leaderboard";

const members = [
  { id: "a", name: "Ann" },
  { id: "b", name: "Ben" },
  { id: "c", name: "Cy" },
];

const session = (...places) => ({
  participants: places.map(([profileId, place]) => ({ profileId, place })),
});

describe("teamLeaderboard", () => {
  it("ranks by wins", () => {
    const rows = teamLeaderboard(
      [
        session(["a", 1], ["b", 2]),
        session(["a", 2], ["b", 1]),
        session(["b", 1], ["c", 2]),
      ],
      members,
    );
    expect(rows.map((r) => r.id)).toEqual(["b", "a", "c"]);
    expect(rows[0]).toMatchObject({ wins: 2, games: 3 });
  });

  it("breaks a tie on wins by win rate", () => {
    const rows = teamLeaderboard(
      [
        session(["a", 1], ["b", 2]),
        session(["a", 2], ["b", 2]),
        session(["b", 1], ["c", 2]),
        session(["c", 1], ["b", 2]),
      ],
      members,
    );
    // a: 1 win of 2 (50%), b: 1 win of 4 (25%), c: 1 win of 2 (50%)
    expect(rows.map((r) => r.id)).toEqual(["a", "c", "b"]);
  });

  it("then by games played", () => {
    const rows = teamLeaderboard(
      [
        session(["a", 1], ["b", 2]),
        session(["a", 1], ["b", 2]),
        session(["c", 2], ["a", 1]),
      ],
      [
        { id: "a", name: "Ann" },
        { id: "d", name: "Dee" },
      ],
    );
    expect(rows[0].id).toBe("a");
    expect(rows[1]).toMatchObject({ id: "d", games: 0, winRate: null });
  });

  it("ignores guests and players outside the team", () => {
    const rows = teamLeaderboard(
      [session(["a", 1], [null, 2], ["zed", 3])],
      members,
    );
    expect(rows.find((r) => r.id === "a")).toMatchObject({ games: 1, wins: 1 });
    expect(rows).toHaveLength(3);
  });

  it("does not count a solo session as a win", () => {
    const rows = teamLeaderboard([session(["a", 1])], members);
    expect(rows.find((r) => r.id === "a")).toMatchObject({
      games: 1,
      wins: 0,
      winRate: null,
    });
  });

  it("lists members who have not played yet", () => {
    const rows = teamLeaderboard([], members);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.games === 0 && r.wins === 0)).toBe(true);
  });

  it("ranks by rating when ratings are given, players without one last", () => {
    const ratings = new Map([
      ["b", 1300],
      ["c", 1450],
    ]);
    const rows = teamLeaderboard([], members, ratings);
    expect(rows.map((r) => [r.id, r.rating])).toEqual([
      ["c", 1450],
      ["b", 1300],
      ["a", null],
    ]);
  });
});
