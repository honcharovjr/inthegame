import { describe, expect, it } from "vitest";
import { playerStats } from "./player";

const CATAN = { id: "c", name: "Catan" };
const UNO = { id: "u", name: "Uno" };
const CHESS = { id: "h", name: "Chess" };

describe("playerStats", () => {
  it("counts each game on its own and overall", () => {
    const rows = [
      { place: 1, participants: 3, game: CATAN },
      { place: 2, participants: 3, game: CATAN },
      { place: 1, participants: 2, game: UNO },
    ];
    const { overall, games } = playerStats(rows);
    expect(overall).toEqual({ played: 3, wins: 2, winRate: 67 });
    expect(games).toEqual([
      { game: CATAN, played: 2, wins: 1, winRate: 50 },
      { game: UNO, played: 1, wins: 1, winRate: 100 },
    ]);
  });

  it("plays solo without a win rate", () => {
    const { games } = playerStats([{ place: 1, participants: 1, game: CHESS }]);
    expect(games[0]).toMatchObject({ played: 1, wins: 0, winRate: null });
  });

  it("orders by sessions, then wins, then name", () => {
    const rows = [
      { place: 2, participants: 2, game: UNO },
      { place: 1, participants: 2, game: CHESS },
      { place: 2, participants: 2, game: CATAN },
    ];
    expect(playerStats(rows).games.map((g) => g.game.name)).toEqual(["Chess", "Catan", "Uno"]);
  });

  it("keeps a removed game in the overall numbers only", () => {
    const { overall, games } = playerStats([
      { place: 1, participants: 2, game: null },
      { place: 2, participants: 2, game: UNO },
    ]);
    expect(overall).toEqual({ played: 2, wins: 1, winRate: 50 });
    expect(games).toHaveLength(1);
  });

  it("is empty without sessions", () => {
    expect(playerStats([])).toEqual({
      overall: { played: 0, wins: 0, winRate: null },
      games: [],
    });
  });
});
