// Targets of the character stat bars, from the achievements of docs/achievements.md.
export const SESSION_STEPS = [1, 10, 50, 100];
export const WIN_STEPS = [1, 10, 25, 50];
export const STREAK_STEPS = [3, 5];

// The next milestone above value, and how far the bar to it is filled, 0 to 1.
// Past the last milestone the bar stays full.
export function milestone(value, steps) {
  const target = steps.find((step) => step > value) ?? steps[steps.length - 1];
  return { target, share: Math.min(value / target, 1) };
}
