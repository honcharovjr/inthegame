import { describe, expect, it } from "vitest";
import { applyTiebreak, placesFromOrder, placesFromScores, placesFromWinner } from "./places";
import { prefillFromSession } from "./prefill";

const ME = "11111111-1111-1111-1111-111111111111";
const MATE = "22222222-2222-2222-2222-222222222222";
const LEFT = "33333333-3333-3333-3333-333333333333";
const GUEST = "44444444-4444-4444-4444-444444444444";
const GUEST2 = "55555555-5555-5555-5555-555555555555";
const TEAM = { id: "team", members: [{ id: ME }, { id: MATE }] };

function session(resultType, participants, teamId = null) {
  return { id: "s1", game_id: "g1", team_id: teamId, result_type: resultType, session_participants: participants };
}

describe("prefillFromSession", () => {
  it("maps players to log flow keys and keeps the winner", () => {
    const result = prefillFromSession(
      session("winner", [
        { profile_id: ME, guest_id: null, place: 2, score: null },
        { profile_id: MATE, guest_id: null, place: 1, score: null },
        { profile_id: null, guest_id: GUEST, place: 2, score: null },
      ], "team"),
      ME,
      TEAM,
    );
    expect(result).toMatchObject({
      sessionId: "s1",
      gameId: "g1",
      teamId: "team",
      memberIds: [MATE],
      guestIds: [GUEST],
      resultType: "winner",
      winner: `p:${MATE}`,
      droppedCount: 0,
    });
    expect(placesFromWinner(result.order, result.winner)).toEqual({ [`p:${MATE}`]: 1, me: 2, [GUEST]: 2 });
  });

  it("rebuilds the ranking order and ties", () => {
    const result = prefillFromSession(
      session("ranking", [
        { profile_id: null, guest_id: GUEST, place: 2, score: null },
        { profile_id: ME, guest_id: null, place: 1, score: null },
        { profile_id: null, guest_id: GUEST2, place: 2, score: null },
      ]),
      ME,
      null,
    );
    expect(result.order).toEqual(["me", GUEST, GUEST2]);
    expect(placesFromOrder(result.order, result.tied)).toEqual({ me: 1, [GUEST]: 2, [GUEST2]: 2 });
  });

  it("restores scores and a chosen tiebreak winner", () => {
    const result = prefillFromSession(
      session("points", [
        { profile_id: ME, guest_id: null, place: 2, score: "40" },
        { profile_id: null, guest_id: GUEST, place: 1, score: "40" },
        { profile_id: null, guest_id: GUEST2, place: 3, score: "12.5" },
      ]),
      ME,
      null,
    );
    expect(result.scores).toEqual({ me: "40", [GUEST]: "40", [GUEST2]: "12.5" });
    expect(result.tiebreak).toBe(GUEST);
    const scores = Object.fromEntries(Object.entries(result.scores).map(([k, v]) => [k, Number(v)]));
    expect(applyTiebreak(placesFromScores(scores), result.tiebreak)).toEqual({ me: 2, [GUEST]: 1, [GUEST2]: 3 });
  });

  it("has no tiebreak for a shared win", () => {
    const result = prefillFromSession(
      session("points", [
        { profile_id: ME, guest_id: null, place: 1, score: "10" },
        { profile_id: null, guest_id: GUEST, place: 1, score: "10" },
      ]),
      ME,
      null,
    );
    expect(result.tiebreak).toBeNull();
  });

  it("drops a teammate who left the team, and the team when the editor left it", () => {
    const stillTeam = prefillFromSession(
      session("ranking", [
        { profile_id: ME, guest_id: null, place: 1, score: null },
        { profile_id: LEFT, guest_id: null, place: 2, score: null },
      ], "team"),
      ME,
      TEAM,
    );
    expect(stillTeam.droppedCount).toBe(1);
    expect(stillTeam.order).toEqual(["me"]);

    const noTeam = prefillFromSession(
      session("ranking", [
        { profile_id: ME, guest_id: null, place: 1, score: null },
        { profile_id: MATE, guest_id: null, place: 2, score: null },
      ], "team"),
      ME,
      null,
    );
    expect(noTeam.teamId).toBeNull();
    expect(noTeam.memberIds).toEqual([]);
    expect(noTeam.droppedCount).toBe(1);
  });
});
