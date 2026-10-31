// Yahtzee for online rooms (FR-45). Adapts the one-device rules to the room
// engine in src/lib/games/online/room.js: player keys are profile ids, moves
// come from requests, and a player who runs out of time has the turn
// skipped by the rule below.
import {
  CATEGORIES,
  ROLLS_PER_TURN,
  currentPlayer,
  finalScores,
  hasRolled,
  isOver,
  newGame,
  options,
  roll,
  score,
  toggleHold,
} from "./rules";

const FRESH_TURN = {
  held: [false, false, false, false, false],
  rollsLeft: ROLLS_PER_TURN,
};

export const yahtzeeOnline = {
  minPlayers: 2,
  maxPlayers: 6,
  turnMs: 60_000,

  newGame,
  currentPlayer,
  isOver,
  result: finalScores,
  players: (game) => game.players,
  turnNumber: (game) => game.turn,

  // move: { type: "roll" } | { type: "hold", index } | { type: "score", category }.
  // Returns the same game when the move changes nothing, so the engine can
  // refuse it.
  move(game, move, random) {
    switch (move?.type) {
      case "roll":
        return roll(game, random);
      case "hold":
        if (!Number.isInteger(move.index) || move.index < 0 || move.index > 4) return game;
        return toggleHold(game, move.index);
      case "score":
        if (!hasRolled(game) || !(move.category in options(currentSheet(game), game.dice))) {
          return game;
        }
        return score(game, move.category);
      default:
        return game;
    }
  },

  // A turn that ran out of time. The dice go into the open box that gives
  // the most points. With no roll yet, or nothing above 0, a random open
  // box gets a 0.
  skipTurn(game, random) {
    if (hasRolled(game)) {
      const allowed = options(currentSheet(game), game.dice);
      const best = CATEGORIES.map((item) => item.id)
        .filter((id) => id in allowed)
        .reduce((top, id) => (top === null || allowed[id] > allowed[top] ? id : top), null);
      if (allowed[best] > 0) return score(game, best);
      const zeros = Object.keys(allowed);
      return score(game, zeros[Math.floor(random() * zeros.length)]);
    }

    const sheet = currentSheet(game);
    const open = CATEGORIES.filter((item) => sheet.boxes[item.id] === null);
    const box = open[Math.floor(random() * open.length)].id;
    return {
      ...game,
      ...FRESH_TURN,
      sheets: {
        ...game.sheets,
        [currentPlayer(game)]: { ...sheet, boxes: { ...sheet.boxes, [box]: 0 } },
      },
      turn: game.turn + 1,
    };
  },

  // Takes a player out. The others keep their sheets and their place in the
  // round; when the removed player was on turn, the next one starts fresh.
  removePlayer(game, key) {
    const index = game.players.indexOf(key);
    if (index === -1) return game;

    const count = game.players.length;
    const players = game.players.filter((item) => item !== key);
    const roundNo = Math.floor(game.turn / count);
    const onTurn = game.turn % count;
    const nextOnTurn = index < onTurn ? onTurn - 1 : onTurn;
    const { [key]: removed, ...sheets } = game.sheets;

    return {
      ...game,
      ...(index === onTurn ? FRESH_TURN : {}),
      players,
      sheets,
      turn: roundNo * players.length + nextOnTurn,
    };
  },
};

function currentSheet(game) {
  return game.sheets[currentPlayer(game)];
}
