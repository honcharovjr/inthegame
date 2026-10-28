import { isSingleEmoji } from "./emoji";
import { GAME_TYPES } from "./types";

// Checks the fields of a game form, for players' custom games and for the
// admin catalog alike. Input: { name, type, minPlayers, maxPlayers,
// duration, emoji, description } where duration, emoji and description are
// optional. Returns { error } or { game } with database column names.
export function validateGameInput(input) {
  const name = String(input?.name ?? "").trim();
  const type = String(input?.type ?? "");
  const min = Number.parseInt(input?.minPlayers, 10);
  const max = Number.parseInt(input?.maxPlayers, 10);
  const emoji = String(input?.emoji ?? "").trim();
  const description = String(input?.description ?? "").trim();
  const rawDuration = String(input?.duration ?? "").trim();
  const duration = rawDuration === "" ? null : Number.parseInt(rawDuration, 10);

  if (name.length < 1 || name.length > 60) {
    return { error: "Give the game a name of up to 60 characters." };
  }
  if (!GAME_TYPES.some((item) => item.value === type)) {
    return { error: "Pick a type for the game." };
  }
  if (emoji && !isSingleEmoji(emoji)) {
    return { error: "Use one emoji for the game." };
  }
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 50) {
    return { error: "Check the number of players." };
  }
  if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
    return { error: "Time must be between 1 and 1440 minutes." };
  }
  if (description.length > 300) {
    return { error: "Keep the description under 300 characters." };
  }

  return {
    game: {
      name,
      type,
      emoji: emoji || null,
      min_players: min,
      max_players: max,
      typical_duration_min: duration,
      description: description || null,
    },
  };
}
