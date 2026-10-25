import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "./catalog";
import { evaluateAchievements } from "./evaluate";

const ME = "p:me";
let counter = 0;

// A session at a day offset. results: [[key, place], ...]
function session(day, results, extra = {}) {
  counter += 1;
  return {
    id: `s${counter}`,
    playedAt: new Date(Date.UTC(2026, 0, 5 + day, 12)).toISOString(),
    gameId: "chess",
    teamId: null,
    gameCreatedBy: null,
    participants: results.map(([key, place]) => ({ key, place })),
    ...extra,
  };
}

const win = (day, extra) => session(day, [[ME, 1], ["g:a", 2]], extra);
const loss = (day, extra) => session(day, [[ME, 2], ["g:a", 1]], extra);

function earned(input) {
  const result = evaluateAchievements({ me: ME, sessions: [], ...input });
  return result.filter((r) => r.earned).map((r) => r.code);
}

describe("catalog", () => {
  it("has 30 achievements and the migration stores every code", () => {
    expect(ACHIEVEMENTS).toHaveLength(30);
    const sql = readFileSync(
      "supabase/migrations/20261027110000_achievements_character.sql",
      "utf8",
    );
    for (const item of ACHIEVEMENTS) expect(sql).toContain(`'${item.code}'`);
  });

  it("returns one result per achievement, in order", () => {
    const result = evaluateAchievements({ me: ME, sessions: [] });
    expect(result.map((r) => r.code)).toEqual(ACHIEVEMENTS.map((a) => a.code));
    expect(result.every((r) => !r.earned && r.current === 0)).toBe(true);
  });
});

describe("sessions and wins", () => {
  it("counts every session, solo ones included, but wins only in ranked ones", () => {
    const solo = session(0, [[ME, 1]]);
    expect(earned({ sessions: [solo] })).toEqual(["first-game"]);
    expect(earned({ sessions: [solo, win(1)] })).toEqual([
      "first-game",
      "first-win",
    ]);
  });

  it("shows progress toward a locked achievement", () => {
    const sessions = Array.from({ length: 7 }, (_, i) => loss(i));
    const regular = evaluateAchievements({ me: ME, sessions }).find(
      (r) => r.code === "regular",
    );
    expect(regular).toMatchObject({ earned: false, current: 7, target: 10 });
  });

  it("awards the 10 win achievement after ten wins", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => win(i));
    expect(earned({ sessions })).toContain("winners-circle");
    expect(earned({ sessions: sessions.slice(0, 9) })).not.toContain("winners-circle");
  });
});

describe("streaks", () => {
  it("needs wins in a row", () => {
    expect(earned({ sessions: [win(0), win(1), loss(2), win(3), win(4)] })).not.toContain("hot-hand");
    expect(earned({ sessions: [win(0), win(1), win(2)] })).toContain("hot-hand");
    expect(earned({ sessions: [0, 1, 2, 3, 4].map((d) => win(d)) })).toContain("on-fire");
  });

  it("ignores solo sessions inside a streak", () => {
    const sessions = [win(0), win(1), session(2, [[ME, 1]]), win(3)];
    expect(earned({ sessions })).toContain("hot-hand");
  });

  it("awards a comeback after three losses then a win", () => {
    expect(earned({ sessions: [loss(0), loss(1), loss(2), win(3)] })).toContain("comeback-kid");
    expect(earned({ sessions: [loss(0), loss(1), win(2)] })).not.toContain("comeback-kid");
  });

  it("awards a dead heat for a shared first place", () => {
    const tie = session(0, [[ME, 1], ["g:a", 1], ["g:b", 3]]);
    expect(earned({ sessions: [tie] })).toContain("dead-heat");
  });
});

describe("variety and social", () => {
  it("counts different games", () => {
    const sessions = ["a", "b", "c", "d", "e"].map((gameId, i) => win(i, { gameId }));
    expect(earned({ sessions })).toContain("explorer");
    expect(earned({ sessions })).not.toContain("globetrotter");
  });

  it("awards Inventor for your own custom game", () => {
    expect(earned({ sessions: [win(0, { gameCreatedBy: "me" })] })).toContain("inventor");
    expect(earned({ sessions: [win(0, { gameCreatedBy: "other" })] })).not.toContain("inventor");
  });

  it("awards Not Alone only for a registered player", () => {
    expect(earned({ sessions: [win(0)] })).not.toContain("not-alone");
    expect(earned({ sessions: [session(0, [[ME, 1], ["p:you", 2]])] })).toContain("not-alone");
  });

  it("awards Full House at five players and counts different people", () => {
    const big = session(0, [[ME, 1], ["g:a", 2], ["g:b", 3], ["g:c", 4], ["g:d", 5]]);
    expect(earned({ sessions: [big] })).toContain("full-house");
    const many = Array.from({ length: 10 }, (_, i) => session(i, [[ME, 1], [`g:${i}`, 2]]));
    expect(earned({ sessions: many })).toContain("crowd-pleaser");
  });

  it("counts wins per game for Master of One", () => {
    const ten = Array.from({ length: 10 }, (_, i) => win(i));
    expect(earned({ sessions: ten })).toContain("master-of-one");
    const spread = ten.map((s, i) => ({ ...s, gameId: i % 2 ? "x" : "y" }));
    expect(earned({ sessions: spread })).not.toContain("master-of-one");
  });
});

describe("teams and rating", () => {
  it("awards Team Player for a session in a team", () => {
    expect(earned({ sessions: [win(0, { teamId: "t" })] })).toContain("team-player");
  });

  it("awards Founder and Recruiter for owned teams", () => {
    expect(earned({ teams: [{ ownedByMe: true, memberCount: 2, sessionCount: 0 }] })).toEqual(["founder"]);
    expect(earned({ teams: [{ ownedByMe: true, memberCount: 4, sessionCount: 0 }] })).toEqual([
      "founder",
      "recruiter",
    ]);
  });

  it("awards Team Champion only for a big enough active team", () => {
    const team = { ownedByMe: false, memberCount: 3, sessionCount: 10, leaderKey: ME };
    expect(earned({ teams: [team] })).toEqual(["team-champion"]);
    expect(earned({ teams: [{ ...team, sessionCount: 9 }] })).toEqual([]);
    expect(earned({ teams: [{ ...team, leaderKey: "p:you" }] })).toEqual([]);
  });

  it("needs three rated sessions for the rating achievements", () => {
    expect(earned({ ratings: [{ gameId: "c", rating: 1150, gamesCount: 3 }] })).toEqual(["rising-star"]);
    expect(earned({ ratings: [{ gameId: "c", rating: 1150, gamesCount: 2 }] })).toEqual([]);
    expect(earned({ ratings: [{ gameId: "c", rating: 1320, gamesCount: 5 }] })).toEqual([
      "rising-star",
      "elite",
    ]);
  });

  it("awards Giant Slayer for beating a player rated 200 higher", () => {
    const s = session(0, [[ME, 1], ["p:big", 2]]);
    const before = { [`${s.id}|${ME}`]: 1000, [`${s.id}|p:big`]: 1200 };
    expect(earned({ sessions: [s], ratingBefore: before })).toContain("giant-slayer");
    const close = { [`${s.id}|${ME}`]: 1000, [`${s.id}|p:big`]: 1199 };
    expect(earned({ sessions: [s], ratingBefore: close })).not.toContain("giant-slayer");
    const lost = session(1, [[ME, 2], ["p:big", 1]]);
    const b2 = { [`${lost.id}|${ME}`]: 1000, [`${lost.id}|p:big`]: 1300 };
    expect(earned({ sessions: [lost], ratingBefore: b2 })).not.toContain("giant-slayer");
  });
});

describe("habits", () => {
  it("awards Weekly Habit for four weeks in a row, Monday to Sunday", () => {
    const four = [0, 7, 14, 21].map((d) => win(d));
    expect(earned({ sessions: four })).toContain("weekly-habit");
    const gap = [0, 7, 21, 28].map((d) => win(d));
    expect(earned({ sessions: gap })).not.toContain("weekly-habit");
  });

  it("awards Marathon for five sessions on one day", () => {
    const day = Array.from({ length: 5 }, () => win(0));
    expect(earned({ sessions: day })).toContain("marathon");
    expect(earned({ sessions: day.slice(0, 4) })).not.toContain("marathon");
  });
});
