// The room engine for online games (FR-45): turns, timers, host actions and
// the end of a game, as pure functions. The server routes load a room, call
// these with the current time and a random source, and save what they
// return. Each game plugs in through an adapter, such as yahtzeeOnline.
//
// State: { host, game, timer: { phase, endsAt }, end, last, endRequest }
// Timer phases, times in epoch milliseconds:
//   turn    the player on turn has until endsAt
//   grace   a second timer. The host may wait for the player or remove them
//   paused  the host chose to wait. No deadline until the host resumes
//   final   the host's own turn ran out twice: a third timer, then the game
//           is dismissed
// end is null while the game runs, then { status, reason, scores? }.
// last is the latest finished turn, { player, ...adapter.lastMove, at }.
// endRequest is { by, at } while a player asks the host to end the game.

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
      if (next.last) next = { ...next, last: { ...next.last, skipped: true } };
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

// A player other than the host asks to end the game. The host answers with
// "end" or "keep".
export function requestEnd(state, playerId, now) {
  assertRunning(state);
  if (playerId === state.host) throw new RoomError("You can end the game yourself");
  if (state.endRequest) throw new RoomError("Someone already asked. Wait for the host", 409);
  return { ...state, endRequest: { by: playerId, at: now } };
}

// action: "end" or "keep" at any time; "wait", "resume" or "remove" about
// another player who is late. Only the host.
export function hostAction(adapter, state, playerId, action, now) {
  assertRunning(state);
  if (playerId !== state.host) throw new RoomError("Only the host can do this", 403);
  // An ended game is not finished: nobody wins and nothing is recorded.
  if (action === "end") {
    return { ...state, endRequest: null, end: { status: "cancelled", reason: "ended" } };
  }
  if (action === "keep") {
    if (!state.endRequest) throw new RoomError("Nobody asked to end the game", 409);
    return { ...state, endRequest: null };
  }
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
  const move = adapter.lastMove?.(state.game, game);
  const last = move ? { player: adapter.currentPlayer(state.game), ...move, at: now } : state.last ?? null;
  if (adapter.isOver(game)) {
    return {
      ...state,
      game,
      last,
      timer: { phase: "turn", endsAt: null },
      end: { status: "finished", reason: "finished", scores: adapter.result(game) },
    };
  }
  return startTurn(adapter, { ...state, game, last }, now);
}

function startTurn(adapter, state, now) {
  return { ...state, timer: { phase: "turn", endsAt: now + adapter.turnMs } };
}

function assertRunning(state) {
  if (!state || state.end) throw new RoomError("The game is over", 409);
}
