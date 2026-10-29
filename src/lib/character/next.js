import { findAchievement } from "../achievements/catalog";
import { ACCESSORIES, BACKGROUNDS } from "./items";

// The closest item still locked: of the accessories and backgrounds that an
// achievement unlocks, the one whose achievement is nearest to done.
// results: the progress from evaluateAchievements, [{ code, earned, current,
// target }]. Returns { item, achievement, current, target } or null when
// everything is open.
export function nextUnlock(results) {
  const progress = new Map(results.map((row) => [row.code, row]));
  let best = null;
  let bestShare = -1;
  for (const item of [...ACCESSORIES, ...BACKGROUNDS]) {
    const state = item.unlockedBy && progress.get(item.unlockedBy);
    if (!state || state.earned || !state.target) continue;
    const share = state.current / state.target;
    if (share > bestShare) {
      bestShare = share;
      best = {
        item: item.label,
        achievement: findAchievement(item.unlockedBy)?.name ?? item.unlockedBy,
        current: Math.min(state.current, state.target),
        target: state.target,
      };
    }
  }
  return best;
}
