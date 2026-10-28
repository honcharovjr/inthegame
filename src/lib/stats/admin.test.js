import { describe, expect, it } from "vitest";
import { dashboardStats } from "./admin";

const NOW = Date.parse("2026-10-28T12:00:00Z");
const daysAgo = (days) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();

const games = [
  { id: "g1", name: "Chess", created_by: null },
  { id: "g2", name: "Yahtzee", created_by: "p1" },
];

function stats(data) {
  return dashboardStats({ profiles: [], sessions: [], participants: [], games, now: NOW, ...data });
}

describe("dashboardStats", () => {
  it("is empty without data", () => {
    const result = stats({});
    expect(result.weekly).toHaveLength(8);
    expect(result.weekly.every((w) => w.sessions === 0 && w.signups === 0)).toBe(true);
    expect(result).toMatchObject({ active7: 0, active30: 0, returning: 0, returningShare: 0, topGames: [] });
  });

  it("puts sessions and sign-ups into rolling weeks, newest last", () => {
    const result = stats({
      profiles: [{ id: "a", created_at: daysAgo(1) }, { id: "b", created_at: daysAgo(8) }],
      sessions: [
        { id: "s1", game_id: "g1", created_by: "a", played_at: daysAgo(0.5) },
        { id: "s2", game_id: "g1", created_by: "a", played_at: daysAgo(6.9) },
        { id: "s3", game_id: "g2", created_by: "b", played_at: daysAgo(7.1) },
        { id: "s4", game_id: "g2", created_by: "b", played_at: daysAgo(80) },
      ],
    });
    expect(result.weekly[7]).toMatchObject({ sessions: 2, signups: 1 });
    expect(result.weekly[6]).toMatchObject({ sessions: 1, signups: 1 });
    expect(result.weekly.reduce((sum, w) => sum + w.sessions, 0)).toBe(3);
  });

  it("counts creators and registered participants as active, not guests", () => {
    const result = stats({
      sessions: [
        { id: "s1", game_id: "g1", created_by: "a", played_at: daysAgo(2) },
        { id: "s2", game_id: "g1", created_by: "c", played_at: daysAgo(20) },
      ],
      participants: [
        { session_id: "s1", profile_id: "a" },
        { session_id: "s1", profile_id: "b" },
        { session_id: "s1", profile_id: null },
      ],
    });
    expect(result.active7).toBe(2);
    expect(result.active30).toBe(3);
  });

  it("counts players active in two or more weeks as returning", () => {
    const result = stats({
      sessions: [
        { id: "s1", game_id: "g1", created_by: "a", played_at: daysAgo(1) },
        { id: "s2", game_id: "g1", created_by: "a", played_at: daysAgo(15) },
        { id: "s3", game_id: "g1", created_by: "b", played_at: daysAgo(2) },
        { id: "s4", game_id: "g1", created_by: "b", played_at: daysAgo(3) },
      ],
    });
    expect(result.activeInWindow).toBe(2);
    expect(result.returning).toBe(1);
    expect(result.returningShare).toBe(0.5);
  });

  it("ranks the top games of the last 30 days", () => {
    const result = stats({
      sessions: [
        { id: "s1", game_id: "g2", created_by: "a", played_at: daysAgo(1) },
        { id: "s2", game_id: "g2", created_by: "a", played_at: daysAgo(2) },
        { id: "s3", game_id: "g1", created_by: "a", played_at: daysAgo(3) },
        { id: "s4", game_id: "g1", created_by: "a", played_at: daysAgo(40) },
        { id: "s5", game_id: "gx", created_by: "a", played_at: daysAgo(4) },
      ],
    });
    expect(result.topGames).toEqual([
      { id: "g2", name: "Yahtzee", custom: true, sessions: 2 },
      { id: "g1", name: "Chess", custom: false, sessions: 1 },
      { id: "gx", name: "Unknown game", custom: false, sessions: 1 },
    ]);
  });

  it("ignores sessions dated in the future", () => {
    const result = stats({
      sessions: [{ id: "s1", game_id: "g1", created_by: "a", played_at: daysAgo(-2) }],
    });
    expect(result.active7).toBe(0);
    expect(result.topGames).toEqual([]);
    expect(result.weekly.reduce((sum, w) => sum + w.sessions, 0)).toBe(0);
  });
});
