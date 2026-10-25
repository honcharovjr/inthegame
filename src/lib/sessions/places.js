// Pure helpers that turn what the player enters into places.
// Place 1 is best. Equal places mean a tie. See docs/rating.md section 5.

export const RESULT_TYPES = ["winner", "ranking", "points"];

// Winner only: the winner has place 1, everyone else shares place 2.
export function placesFromWinner(participantKeys, winnerKey) {
  if (!participantKeys.includes(winnerKey)) {
    throw new Error("The winner must be one of the participants");
  }
  return Object.fromEntries(
    participantKeys.map((key) => [key, key === winnerKey ? 1 : 2]),
  );
}

// Points: higher score is better. Equal scores tie and share the best place.
// Competition ranking: scores 10, 7, 7, 3 give places 1, 2, 2, 4.
export function placesFromScores(scores) {
  const keys = Object.keys(scores);
  return Object.fromEntries(
    keys.map((key) => [
      key,
      1 + keys.filter((other) => scores[other] > scores[key]).length,
    ]),
  );
}

// Ranking: the player gives a place per participant. Places must be whole
// numbers from 1 up to the number of participants, and place 1 must be used.
export function validatePlaces(places) {
  const values = Object.values(places);
  const count = values.length;
  const valid =
    count > 0 &&
    values.every((p) => Number.isInteger(p) && p >= 1 && p <= count) &&
    values.includes(1);
  if (!valid) {
    throw new Error("Places must be whole numbers starting at 1");
  }
  return places;
}
