import { describe, expect, it } from "vitest";
import { validateGameInput } from "./validate";

const base = { name: " Uno ", type: "card", minPlayers: "2", maxPlayers: "10" };

describe("validateGameInput", () => {
  it("returns database columns with optional fields as null", () => {
    expect(validateGameInput(base)).toEqual({
      game: {
        name: "Uno",
        type: "card",
        emoji: null,
        min_players: 2,
        max_players: 10,
        typical_duration_min: null,
        description: null,
      },
    });
  });

  it("keeps duration, emoji and description", () => {
    const { game } = validateGameInput({ ...base, duration: "30", emoji: "🃏", description: " Fast " });
    expect(game).toMatchObject({ typical_duration_min: 30, emoji: "🃏", description: "Fast" });
  });

  it("rejects bad input", () => {
    expect(validateGameInput({ ...base, name: "" }).error).toBeTruthy();
    expect(validateGameInput({ ...base, type: "sport" }).error).toBeTruthy();
    expect(validateGameInput({ ...base, minPlayers: "5", maxPlayers: "3" }).error).toBeTruthy();
    expect(validateGameInput({ ...base, duration: "0" }).error).toBeTruthy();
    expect(validateGameInput({ ...base, emoji: "ab" }).error).toBeTruthy();
    expect(validateGameInput({ ...base, description: "x".repeat(301) }).error).toBeTruthy();
  });
});
