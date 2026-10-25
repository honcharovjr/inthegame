import { describe, expect, it } from "vitest";
import { teamGames } from "./teamGames";

const entry = (gameId, name) => ({ gameId, game: { name, type: "board" } });

describe("teamGames", () => {
  it("counts sessions per game and puts the most played first", () => {
    const games = teamGames([
      entry("c", "Chess"),
      entry("y", "Yahtzee"),
      entry("y", "Yahtzee"),
    ]);
    expect(games.map((g) => [g.id, g.sessions])).toEqual([
      ["y", 2],
      ["c", 1],
    ]);
  });

  it("breaks ties by name", () => {
    const games = teamGames([entry("y", "Yahtzee"), entry("c", "Chess")]);
    expect(games.map((g) => g.name)).toEqual(["Chess", "Yahtzee"]);
  });

  it("ignores sessions without a game and handles an empty list", () => {
    expect(teamGames([{ gameId: null }])).toEqual([]);
    expect(teamGames([])).toEqual([]);
  });
});
