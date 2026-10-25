import { describe, expect, it } from "vitest";
import {
  actualScore,
  expectedScore,
  rateSession,
  replaySessions,
} from "./elo";

const byKey = (results) => Object.fromEntries(results.map((r) => [r.key, r]));
const near = (value, target, digits = 1) =>
  expect(value).toBeCloseTo(target, digits);

describe("hand-checked cases (docs/rating.md section 8)", () => {
  it("two equal players, A wins: +16 and -16", () => {
    const r = byKey(
      rateSession([
        { key: "a", rating: 1000, place: 1 },
        { key: "b", rating: 1000, place: 2 },
      ]),
    );
    near(r.a.delta, 16);
    near(r.b.delta, -16);
  });

  it("three equal players, places 1, 2, 3: +16, 0, -16", () => {
    const r = byKey(
      rateSession([
        { key: "a", rating: 1000, place: 1 },
        { key: "b", rating: 1000, place: 2 },
        { key: "c", rating: 1000, place: 3 },
      ]),
    );
    near(r.a.delta, 16);
    near(r.b.delta, 0);
    near(r.c.delta, -16);
  });

  it("a full tie between equal players changes nothing", () => {
    const results = rateSession([
      { key: "a", rating: 1000, place: 1 },
      { key: "b", rating: 1000, place: 1 },
      { key: "c", rating: 1000, place: 1 },
    ]);
    for (const r of results) near(r.delta, 0);
  });

  it("a 1200 player beating a 1000 player gains about 7.7", () => {
    const r = byKey(
      rateSession([
        { key: "a", rating: 1200, place: 1 },
        { key: "b", rating: 1000, place: 2 },
      ]),
    );
    near(r.a.delta, 7.7);
    near(r.b.delta, -7.7);
  });

  it("a 1000 player beating a 1200 player gains about 24.3", () => {
    const r = byKey(
      rateSession([
        { key: "a", rating: 1000, place: 1 },
        { key: "b", rating: 1200, place: 2 },
      ]),
    );
    near(r.a.delta, 24.3);
    near(r.b.delta, -24.3);
  });
});

describe("properties", () => {
  it("the changes of one session add up to zero", () => {
    const results = rateSession([
      { key: "a", rating: 1300, place: 2 },
      { key: "b", rating: 900, place: 1 },
      { key: "c", rating: 1100, place: 3 },
      { key: "d", rating: 1000, place: 3 },
    ]);
    const total = results.reduce((sum, r) => sum + r.delta, 0);
    expect(Math.abs(total)).toBeLessThan(1e-9);
  });

  it("expected scores of a pair add up to one", () => {
    expect(expectedScore(1234, 987) + expectedScore(987, 1234)).toBeCloseTo(1);
  });

  it("scores a better place 1, a tie 0.5 and a worse place 0", () => {
    expect(actualScore(1, 2)).toBe(1);
    expect(actualScore(2, 2)).toBe(0.5);
    expect(actualScore(3, 2)).toBe(0);
  });

  it("does not rate a session with one participant", () => {
    const [r] = rateSession([{ key: "a", rating: 1000, place: 1 }]);
    expect(r.delta).toBe(0);
    expect(r.after).toBe(1000);
  });
});

describe("replaySessions", () => {
  const sessions = [
    {
      id: "s2",
      playedAt: "2026-10-02T20:00:00Z",
      createdAt: "2026-10-02T20:05:00Z",
      participants: [
        { key: "a", place: 2 },
        { key: "b", place: 1 },
      ],
    },
    {
      id: "s1",
      playedAt: "2026-10-01T20:00:00Z",
      createdAt: "2026-10-01T20:05:00Z",
      participants: [
        { key: "a", place: 1 },
        { key: "b", place: 2 },
      ],
    },
  ];

  it("replays in play order whatever the input order", () => {
    const { ratings, history } = replaySessions(sessions);
    expect(history.map((h) => h.sessionId)).toEqual(["s1", "s1", "s2", "s2"]);
    expect(ratings.get("a").gamesCount).toBe(2);
    expect(ratings.get("a").rating + ratings.get("b").rating).toBeCloseTo(2000);
  });

  it("gives identical results when rebuilt twice", () => {
    const first = replaySessions(sessions);
    const second = replaySessions(sessions);
    expect([...second.ratings]).toEqual([...first.ratings]);
    expect(second.history).toEqual(first.history);
  });

  it("is the same as a history in which a deleted session never existed", () => {
    const withoutS2 = sessions.filter((s) => s.id !== "s2");
    const { ratings } = replaySessions(withoutS2);
    near(ratings.get("a").rating, 1016);
    near(ratings.get("b").rating, 984);
  });

  it("breaks ties between equal timestamps by creation time", () => {
    const base = {
      playedAt: "2026-10-01T20:00:00Z",
      participants: [
        { key: "a", place: 1 },
        { key: "b", place: 2 },
      ],
    };
    const early = { ...base, id: "x", createdAt: "2026-10-01T20:01:00Z" };
    const late = {
      ...base,
      id: "y",
      createdAt: "2026-10-01T20:02:00Z",
      participants: [
        { key: "a", place: 2 },
        { key: "b", place: 1 },
      ],
    };
    const one = replaySessions([early, late]);
    const two = replaySessions([late, early]);
    expect([...one.ratings]).toEqual([...two.ratings]);
  });

  it("skips sessions with fewer than two participants", () => {
    const solo = {
      id: "solo",
      playedAt: "2026-10-03T20:00:00Z",
      createdAt: "2026-10-03T20:00:00Z",
      participants: [{ key: "a", place: 1 }],
    };
    expect(replaySessions([solo]).ratings.size).toBe(0);
  });
});
