// The room engine for online games (FR-45): turns, timers, host actions and
// the end of a game, as pure functions. The server routes load a room, call
// these with the current time and a random source, and save what they
// return. Each game plugs in through an adapter, such as yahtzeeOnline.
//
// State: { host, game, timer: { phase, endsAt }, end }
// Timer phases, times in epoch milliseconds:
//   turn    the player on turn has until endsAt
//   grace   a second timer. The host may wait for the player or remove them
//   paused  the host chose to wait. No deadline until the host resumes
//   final   the host's own turn ran out twice: a third timer, then the game
//           is dismissed
// end is null while the game runs, then { status, reason, scores? }.

export const INVITE_MS = 15 * 60_000;
export const GRACE_MS = 60_000;

export class RoomError extends Error {
  // status is the HTTP status the route answers with.
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function inviteExpired(invitedAt, now) {
  return now >= new Date(invitedAt).getTime() + INVITE_MS;
}

// playerIds in turn order, host first.
export function startState(adapter, host, playerIds, now) {
  if (playerIds.length < adapter.minPlayers || playerIds.length > adapter.maxPlayers) {
    throw new RoomError("Wrong number of players");
  }
  return {
    host,
    game: adapter.newGame(playerIds),
    timer: { phase: "turn", endsAt: now + adapter.turnMs },
    end: null,
  };
}

// Applies every deadline that has passed by now, in order. A room nobody
// looked at for a while catches up in one call.
export function advance(adapter, state, now, random) {
  let next = state;
  while (!next.end && next.timer.endsAt !== null && now >= next.timer.endsAt) {
    const { phase, endsAt } = next.timer;
    const hostOnTurn = adapter.currentPlayer(next.game) === next.host;

    if (phase === "turn") {
      next = { ...next, timer: { phase: "grace", endsAt: endsAt + GRACE_MS } };
    } else if (phase === "grace" && hostOnTurn) {
      next = { ...next, timer: { phase: "final", endsAt: endsAt + GRACE_MS } };
    } else if (phase === "grace") {
      next = afterTurn(adapter, next, adapter.skipTurn(next.game, random), endsAt);
    } else {
      next = { ...next, end: { status: "cancelled", reason: "dismissed" } };
    }
  }
  return next;
}

// A move by a player. Only the player on turn may move, also while late.
export function applyMove(adapter, state, playerId, move, now, random) {
  assertRunning(state);
  if (adapter.currentPlayer(state.game) !== playerId) {
    throw new RoomError("It is not your turn", 403);
  }
  const game = adapter.move(state.game, move, random);
  if (game === state.game) throw new RoomError("This move is not allowed now");
  if (adapter.turnNumber(game) === adapter.turnNumber(state.game)) {
    return { ...state, game };
  }
  return afterTurn(adapter, state, game, now);
}

// action: "wait", "resume" or "remove". Only the host, and only about
// another player who is late.
export function hostAction(adapter, state, playerId, action, now) {
  assertRunning(state);
  if (playerId !== state.host) throw new RoomError("Only the host can do this", 403);
  const late = adapter.currentPlayer(state.game);
  if (late === state.host) throw new RoomError("This is your own turn");
  const { phase } = state.timer;

  if (action === "wait" && phase === "grace") {
    return { ...state, timer: { phase: "paused", endsAt: null } };
  }
  if (action === "resume" && phase === "paused") {
    return { ...state, timer: { phase: "turn", endsAt: now + adapter.turnMs } };
  }
  if (action === "remove" && (phase === "grace" || phase === "paused")) {
    const game = adapter.removePlayer(state.game, late);
    if (adapter.players(game).length < 2) {
      return { ...state, game, end: { status: "cancelled", reason: "alone" } };
    }
    return startTurn(adapter, { ...state, game }, now);
  }
  throw new RoomError("This is not allowed now");
}

// The player on turn, or null when the game has ended.
export function onTurn(adapter, state) {
  return state.end ? null : adapter.currentPlayer(state.game);
}

function afterTurn(adapter, state, game, now) {
  if (adapter.isOver(game)) {
    return {
      ...state,
      game,
      timer: { phase: "turn", endsAt: null },
      end: { status: "finished", reason: "finished", scores: adapter.result(game) },
    };
  }
  return startTurn(adapter, { ...state, game }, now);
}

function startTurn(adapter, state, now) {
  return { ...state, timer: { phase: "turn", endsAt: now + adapter.turnMs } };
}

function assertRunning(state) {
  if (!state || state.end) throw new RoomError("The game is over", 409);
}
