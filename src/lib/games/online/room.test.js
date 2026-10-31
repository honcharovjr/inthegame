import { describe, expect, it } from "vitest";
import { yahtzeeOnline as yahtzee } from "../yahtzee/online";
import {
  GRACE_MS,
  INVITE_MS,
  RoomError,
  advance,
  applyMove,
  hostAction,
  inviteExpired,
  onTurn,
  requestEnd,
  startState,
} from "./room";

const T0 = 1_000_000;
const TURN = yahtzee.turnMs;
const random = () => 0.5;

function started(players = ["host", "amy", "bo"]) {
  return startState(yahtzee, "host", players, T0);
}

describe("inviteExpired", () => {
  it("expires 15 minutes after the invite", () => {
    const at = new Date(T0).toISOString();
    expect(inviteExpired(at, T0 + INVITE_MS - 1)).toBe(false);
    expect(inviteExpired(at, T0 + INVITE_MS)).toBe(true);
  });
});

describe("startState", () => {
  it("starts with the host on turn and the turn timer running", () => {
    const state = started();
    expect(onTurn(yahtzee, state)).toBe("host");
    expect(state.timer).toEqual({ phase: "turn", endsAt: T0 + TURN });
    expect(state.end).toBeNull();
  });

  it("needs 2 to 6 players", () => {
    expect(() => started(["host"])).toThrow(RoomError);
    expect(() => started(["host", "a", "b", "c", "d", "e", "f"])).toThrow(RoomError);
  });
});

describe("applyMove", () => {
  it("lets only the player on turn move", () => {
    expect(() => applyMove(yahtzee, started(), "amy", { type: "roll" }, T0, random)).toThrow(
      "It is not your turn",
    );
  });

  it("refuses a move that changes nothing", () => {
    expect(() =>
      applyMove(yahtzee, started(), "host", { type: "score", category: "chance" }, T0, random),
    ).toThrow("not allowed");
  });

  it("starts the next turn timer after scoring", () => {
    let state = applyMove(yahtzee, started(), "host", { type: "roll" }, T0 + 5_000, random);
    expect(state.timer.endsAt).toBe(T0 + TURN);
    state = applyMove(yahtzee, state, "host", { type: "score", category: "chance" }, T0 + 9_000, random);
    expect(onTurn(yahtzee, state)).toBe("amy");
    expect(state.timer).toEqual({ phase: "turn", endsAt: T0 + 9_000 + TURN });
  });

  it("still lets a late player finish the turn", () => {
    let state = startState(yahtzee, "host", ["host", "amy"], T0);
    state = applyMove(yahtzee, state, "host", { type: "roll" }, T0, random);
    state = applyMove(yahtzee, state, "host", { type: "score", category: "chance" }, T0, random);
    state = advance(yahtzee, state, T0 + TURN, random);
    expect(state.timer.phase).toBe("grace");
    state = applyMove(yahtzee, state, "amy", { type: "roll" }, T0 + TURN + 1, random);
    expect(state.game.rollsLeft).toBe(2);
  });

  it("ends the game with scores after the last box", () => {
    let state = startState(yahtzee, "host", ["host", "amy"], T0);
    state = { ...state, game: { ...state.game, turn: 25 } };
    state = applyMove(yahtzee, state, "amy", { type: "roll" }, T0, random);
    state = applyMove(yahtzee, state, "amy", { type: "score", category: "chance" }, T0, random);
    expect(state.end).toEqual({
      status: "finished",
      reason: "finished",
      scores: { host: 0, amy: 20 },
    });
    expect(() => applyMove(yahtzee, state, "host", { type: "roll" }, T0, random)).toThrow(
      "The game is over",
    );
  });
});

describe("advance", () => {
  // amy on turn from T0.
  function amyOnTurn() {
    let state = started();
    state = applyMove(yahtzee, state, "host", { type: "roll" }, T0, random);
    return applyMove(yahtzee, state, "host", { type: "score", category: "chance" }, T0, random);
  }

  it("does nothing before the deadline", () => {
    const state = amyOnTurn();
    expect(advance(yahtzee, state, T0 + TURN - 1, random)).toBe(state);
  });

  it("starts the second timer when the turn runs out", () => {
    const state = advance(yahtzee, amyOnTurn(), T0 + TURN, random);
    expect(state.timer).toEqual({ phase: "grace", endsAt: T0 + TURN + GRACE_MS });
  });

  it("skips the turn when the host does nothing", () => {
    const state = advance(yahtzee, amyOnTurn(), T0 + TURN + GRACE_MS, random);
    expect(onTurn(yahtzee, state)).toBe("bo");
    expect(Object.values(state.game.sheets.amy.boxes).filter((box) => box !== null)).toEqual([0]);
    expect(state.timer).toEqual({ phase: "turn", endsAt: T0 + TURN + GRACE_MS + TURN });
  });

  it("gives the host a third timer on their own turn, then dismisses the game", () => {
    let state = advance(yahtzee, started(), T0 + TURN + GRACE_MS, random);
    expect(state.timer).toEqual({ phase: "final", endsAt: T0 + TURN + 2 * GRACE_MS });
    expect(state.end).toBeNull();
    state = advance(yahtzee, state, T0 + TURN + 2 * GRACE_MS, random);
    expect(state.end).toEqual({ status: "cancelled", reason: "dismissed" });
  });

  it("catches up on several deadlines at once", () => {
    // amy and bo are skipped, then the host runs out of time twice.
    const state = advance(yahtzee, amyOnTurn(), T0 + 10 * TURN, random);
    expect(state.end).toEqual({ status: "cancelled", reason: "dismissed" });
    expect(onTurn(yahtzee, state)).toBeNull();
  });

  it("never runs a paused timer", () => {
    let state = advance(yahtzee, amyOnTurn(), T0 + TURN, random);
    state = hostAction(yahtzee, state, "host", "wait", T0 + TURN + 1);
    expect(advance(yahtzee, state, T0 + 100 * TURN, random)).toBe(state);
  });
});

describe("hostAction", () => {
  function late() {
    let state = started(["host", "amy", "bo"]);
    state = applyMove(yahtzee, state, "host", { type: "roll" }, T0, random);
    state = applyMove(yahtzee, state, "host", { type: "score", category: "chance" }, T0, random);
    return advance(yahtzee, state, T0 + TURN, random);
  }

  it("waits, then resumes with a fresh turn timer", () => {
    let state = hostAction(yahtzee, late(), "host", "wait", T0 + TURN + 1);
    expect(state.timer).toEqual({ phase: "paused", endsAt: null });
    state = hostAction(yahtzee, state, "host", "resume", T0 + 500_000);
    expect(state.timer).toEqual({ phase: "turn", endsAt: T0 + 500_000 + TURN });
    expect(onTurn(yahtzee, state)).toBe("amy");
  });

  it("removes the late player, and the next one starts", () => {
    const state = hostAction(yahtzee, late(), "host", "remove", T0 + TURN + 1);
    expect(state.game.players).toEqual(["host", "bo"]);
    expect(onTurn(yahtzee, state)).toBe("bo");
    expect(state.timer).toEqual({ phase: "turn", endsAt: T0 + TURN + 1 + TURN });
  });

  it("also removes from the wait", () => {
    let state = hostAction(yahtzee, late(), "host", "wait", T0 + TURN + 1);
    state = hostAction(yahtzee, state, "host", "remove", T0 + TURN + 2);
    expect(state.game.players).toEqual(["host", "bo"]);
  });

  it("ends the game with no winner when one player is left", () => {
    let state = startState(yahtzee, "host", ["host", "amy"], T0);
    state = applyMove(yahtzee, state, "host", { type: "roll" }, T0, random);
    state = applyMove(yahtzee, state, "host", { type: "score", category: "chance" }, T0, random);
    state = advance(yahtzee, state, T0 + TURN, random);
    state = hostAction(yahtzee, state, "host", "remove", T0 + TURN + 1);
    expect(state.end).toEqual({ status: "cancelled", reason: "alone" });
  });

  it("is for the host only, and only after the turn ran out", () => {
    expect(() => hostAction(yahtzee, late(), "bo", "remove", T0)).toThrow("Only the host");
    expect(() => hostAction(yahtzee, late(), "host", "resume", T0)).toThrow("not allowed");
    expect(() => hostAction(yahtzee, started(), "host", "wait", T0)).toThrow("your own turn");
  });
});

describe("last move", () => {
  it("records the box and points of each finished turn", () => {
    let state = applyMove(yahtzee, started(), "host", { type: "roll" }, T0, random);
    state = applyMove(yahtzee, state, "host", { type: "score", category: "chance" }, T0 + 5, random);
    expect(state.last).toEqual({ player: "host", category: "chance", points: 20, at: T0 + 5 });
  });

  it("marks a skipped turn", () => {
    const state = advance(yahtzee, started(["amy", "host"]), T0 + TURN + GRACE_MS, random);
    expect(state.last).toMatchObject({ player: "amy", points: 0, skipped: true });
  });
});

describe("ending a game", () => {
  it("lets the host end it at any time, with no winner", () => {
    const state = hostAction(yahtzee, started(), "host", "end", T0);
    expect(state.end).toEqual({ status: "cancelled", reason: "ended" });
  });

  it("lets a player ask, and the host keep playing", () => {
    let state = requestEnd(started(), "amy", T0);
    expect(state.endRequest).toEqual({ by: "amy", at: T0 });
    expect(() => requestEnd(state, "bo", T0)).toThrow("already asked");
    state = hostAction(yahtzee, state, "host", "keep", T0);
    expect(state.endRequest).toBeNull();
    expect(state.end).toBeNull();
  });

  it("is the host's decision only", () => {
    expect(() => requestEnd(started(), "host", T0)).toThrow("end the game yourself");
    expect(() => hostAction(yahtzee, started(), "amy", "end", T0)).toThrow("Only the host");
    expect(() => hostAction(yahtzee, started(), "host", "keep", T0)).toThrow("Nobody asked");
  });
});
