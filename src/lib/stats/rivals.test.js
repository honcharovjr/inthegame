import { describe, expect, it } from "vitest";
import { headToHead } from "./rivals";

const session = (...places) => ({
  participants: places.map(([key, place]) => ({ key, place, name: key })),
});

describe("headToHead", () => {
  it("counts wins, losses and ties against each player", () => {
    const sessions = [
      session(["me", 1], ["anna", 2], ["mark", 3]),
      session(["me", 2], ["anna", 1]),
      session(["me", 1], ["anna", 1]),
    ];
    const [anna, mark] = headToHead(sessions, "me");
    expect(anna).toEqual({ key: "anna", name: "anna", wins: 1, losses: 1, ties: 1, games: 3 });
    expect(mark).toMatchObject({ key: "mark", wins: 1, losses: 0, games: 1 });
  });

  it("puts the people met most first and keeps the limit", () => {
    const sessions = [
      session(["me", 1], ["lena", 2]),
      session(["me", 1], ["oleg", 2]),
      session(["me", 2], ["oleg", 1]),
    ];
    const rivals = headToHead(sessions, "me", 1);
    expect(rivals.map((r) => r.key)).toEqual(["oleg"]);
  });

  it("ignores sessions without the player", () => {
    expect(headToHead([session(["anna", 1], ["mark", 2])], "me")).toEqual([]);
  });
});
