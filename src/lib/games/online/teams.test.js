import { describe, expect, it } from "vitest";
import { onlySharedTeam } from "./teams";

const row = (team_id, profile_id) => ({ team_id, profile_id });

describe("onlySharedTeam", () => {
  it("is the one team every player is in", () => {
    const rows = [row("t1", "a"), row("t1", "b"), row("t2", "a")];
    expect(onlySharedTeam(rows, ["a", "b"])).toBe("t1");
  });

  it("is null when the players share no team", () => {
    expect(onlySharedTeam([row("t1", "a"), row("t2", "b")], ["a", "b"])).toBeNull();
  });

  it("is null when they share several teams", () => {
    const rows = [row("t1", "a"), row("t1", "b"), row("t2", "a"), row("t2", "b")];
    expect(onlySharedTeam(rows, ["a", "b"])).toBeNull();
  });
});
