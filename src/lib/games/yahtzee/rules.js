// Yahtzee rules as pure functions: scoring, the score sheet and the turns of
// a game played on one device. The UI keeps a game object and replaces it
// with what these functions return. Nothing here mutates its input.

export const UPPER = [
  { id: "ones", label: "Ones", face: 1, hint: "Only 1s count" },
  { id: "twos", label: "Twos", face: 2, hint: "Only 2s count" },
  { id: "threes", label: "Threes", face: 3, hint: "Only 3s count" },
  { id: "fours", label: "Fours", face: 4, hint: "Only 4s count" },
  { id: "fives", label: "Fives", face: 5, hint: "Only 5s count" },
  { id: "sixes", label: "Sixes", face: 6, hint: "Only 6s count" },
];

export const LOWER = [
  { id: "threeKind", label: "Three of a kind", hint: "Sum of all dice" },
  { id: "fourKind", label: "Four of a kind", hint: "Sum of all dice" },
  { id: "fullHouse", label: "Full house", hint: "3 + 2 of a kind: 25" },
  { id: "smallStraight", label: "Small straight", hint: "4 in a row: 30" },
  { id: "largeStraight", label: "Large straight", hint: "5 in a row: 40" },
  { id: "yahtzee", label: "Yahtzee", hint: "5 of a kind: 50" },
  { id: "chance", label: "Chance", hint: "Sum of all dice" },
];

export const CATEGORIES = [...UPPER, ...LOWER];
export const ROUNDS = CATEGORIES.length;
export const ROLLS_PER_TURN = 3;
export const UPPER_BONUS_AT = 63;
export const UPPER_BONUS = 35;
export const YAHTZEE_BONUS = 100;

const FIXED = { fullHouse: 25, smallStraight: 30, largeStraight: 40, yahtzee: 50 };

function counts(dice) {
  const result = [0, 0, 0, 0, 0, 0, 0];
  for (const face of dice) result[face] += 1;
  return result;
}

function sum(dice) {
  return dice.reduce((total, face) => total + face, 0);
}

function hasRun(dice, length) {
  const faces = new Set(dice);
  for (let start = 1; start + length - 1 <= 6; start += 1) {
    let run = true;
    for (let face = start; face < start + length; face += 1) {
      if (!faces.has(face)) run = false;
    }
    if (run) return true;
  }
  return false;
}

export function isYahtzee(dice) {
  return dice.length === 5 && dice.every((face) => face === dice[0]);
}

// Points the dice give in a category by the plain rules, without jokers.
export function scoreFor(category, dice) {
  const upper = UPPER.find((item) => item.id === category);
  if (upper) return dice.filter((face) => face === upper.face).length * upper.face;

  const most = Math.max(...counts(dice));
  const sorted = counts(dice).filter(Boolean).sort();
  switch (category) {
    case "threeKind":
      return most >= 3 ? sum(dice) : 0;
    case "fourKind":
      return most >= 4 ? sum(dice) : 0;
    case "fullHouse":
      return sorted.length === 2 && sorted[0] === 2 ? FIXED.fullHouse : 0;
    case "smallStraight":
      return hasRun(dice, 4) ? FIXED.smallStraight : 0;
    case "largeStraight":
      return hasRun(dice, 5) ? FIXED.largeStraight : 0;
    case "yahtzee":
      return isYahtzee(dice) ? FIXED.yahtzee : 0;
    case "chance":
      return sum(dice);
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

export function emptySheet() {
  return {
    boxes: Object.fromEntries(CATEGORIES.map((item) => [item.id, null])),
    yahtzeeBonus: 0,
  };
}

// The categories the player may score right now, with their points.
// A second Yahtzee follows the official joker rule: when its upper box is
// open it must go there; otherwise any open lower box takes it at full
// value; when those are full too, an open upper box takes a zero.
export function options(sheet, dice) {
  const open = CATEGORIES.filter((item) => sheet.boxes[item.id] === null);
  const joker = isYahtzee(dice) && sheet.boxes.yahtzee !== null;

  if (!joker) {
    return Object.fromEntries(open.map((item) => [item.id, scoreFor(item.id, dice)]));
  }

  const upperId = UPPER[dice[0] - 1].id;
  if (sheet.boxes[upperId] === null) {
    return { [upperId]: scoreFor(upperId, dice) };
  }
  const openLower = open.filter((item) => LOWER.includes(item));
  if (openLower.length > 0) {
    return Object.fromEntries(
      openLower.map((item) => [item.id, FIXED[item.id] ?? sum(dice)]),
    );
  }
  return Object.fromEntries(open.map((item) => [item.id, 0]));
}

// Writes the points into a box. A Yahtzee rolled after the Yahtzee box was
// filled with 50 also earns a bonus.
export function scoreSheet(sheet, category, dice) {
  const allowed = options(sheet, dice);
  if (!(category in allowed)) {
    throw new Error(`${category} cannot be scored now`);
  }
  const bonus = isYahtzee(dice) && sheet.boxes.yahtzee === FIXED.yahtzee ? 1 : 0;
  return {
    boxes: { ...sheet.boxes, [category]: allowed[category] },
    yahtzeeBonus: sheet.yahtzeeBonus + bonus,
  };
}

export function totals(sheet) {
  const add = (list) =>
    list.reduce((total, item) => total + (sheet.boxes[item.id] ?? 0), 0);
  const upper = add(UPPER);
  const upperBonus = upper >= UPPER_BONUS_AT ? UPPER_BONUS : 0;
  const lower = add(LOWER);
  const yahtzeeBonus = sheet.yahtzeeBonus * YAHTZEE_BONUS;
  return {
    upper,
    upperBonus,
    lower,
    yahtzeeBonus,
    total: upper + upperBonus + lower + yahtzeeBonus,
  };
}

// The game: players take turns in order until every sheet is full.
export function newGame(playerKeys) {
  if (playerKeys.length < 1) throw new Error("A game needs a player");
  return {
    players: [...playerKeys],
    sheets: Object.fromEntries(playerKeys.map((key) => [key, emptySheet()])),
    turn: 0,
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsLeft: ROLLS_PER_TURN,
  };
}

export function currentPlayer(game) {
  return game.players[game.turn % game.players.length];
}

// Round 1 to 13.
export function round(game) {
  return Math.min(ROUNDS, Math.floor(game.turn / game.players.length) + 1);
}

export function isOver(game) {
  return game.turn >= ROUNDS * game.players.length;
}

export function hasRolled(game) {
  return game.rollsLeft < ROLLS_PER_TURN;
}

// random returns a number in [0, 1), like Math.random.
export function roll(game, random = Math.random) {
  if (isOver(game) || game.rollsLeft === 0) return game;
  const first = !hasRolled(game);
  return {
    ...game,
    dice: game.dice.map((face, index) =>
      !first && game.held[index] ? face : 1 + Math.floor(random() * 6),
    ),
    held: first ? [false, false, false, false, false] : game.held,
    rollsLeft: game.rollsLeft - 1,
  };
}

export function toggleHold(game, index) {
  if (!hasRolled(game) || game.rollsLeft === 0) return game;
  return {
    ...game,
    held: game.held.map((on, i) => (i === index ? !on : on)),
  };
}

// Scores a box for the current player and passes the dice on.
export function score(game, category) {
  if (isOver(game) || !hasRolled(game)) {
    throw new Error("Roll before scoring");
  }
  const key = currentPlayer(game);
  return {
    ...game,
    sheets: {
      ...game.sheets,
      [key]: scoreSheet(game.sheets[key], category, game.dice),
    },
    turn: game.turn + 1,
    held: [false, false, false, false, false],
    rollsLeft: ROLLS_PER_TURN,
  };
}

export function finalScores(game) {
  return Object.fromEntries(
    game.players.map((key) => [key, totals(game.sheets[key]).total]),
  );
}

// A saved game from the browser, checked before it is trusted.
export function isValidGame(game) {
  return (
    Boolean(game) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every((key) => game.sheets?.[key]?.boxes) &&
    Number.isInteger(game.turn) &&
    Array.isArray(game.dice) &&
    game.dice.length === 5 &&
    Array.isArray(game.held) &&
    Number.isInteger(game.rollsLeft)
  );
}
