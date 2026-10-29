import { describe, expect, it } from "vitest";
import { winStreaks } from "./streak";

const row = (day, place, participants = 3) => ({ place, participants, playedAt: `2026-10-${day}T18:00:00Z` });

describe("winStreaks", () => {
  it("is zero with no sessions", () => {
    expect(winStreaks([])).toEqual({ current: 0, best: 0 });
  });

  it("counts wins in a row up to the latest session, in date order", () => {
    const rows = [row(14, 1), row(10, 1), row(11, 1), row(12, 2), row(13, 1)];
    expect(winStreaks(rows)).toEqual({ current: 2, best: 2 });
  });

  it("keeps the best run after a loss", () => {
    const rows = [row(10, 1), row(11, 1), row(12, 1), row(13, 2)];
    expect(winStreaks(rows)).toEqual({ current: 0, best: 3 });
  });

  it("skips solo sessions: they neither extend nor break a streak", () => {
    const rows = [row(10, 1), row(11, 1, 1), row(12, 1)];
    expect(winStreaks(rows)).toEqual({ current: 2, best: 2 });
  });
});
