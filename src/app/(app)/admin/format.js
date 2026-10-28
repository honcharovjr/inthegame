// Text helpers for the admin pages.

const ACTIONS = {
  "game.add": "added",
  "game.edit": "edited",
  "game.delete": "deleted",
  "game.promote": "added to the catalog",
  "player.block": "blocked",
  "player.unblock": "unblocked",
};

// The verb of an admin action, for example "added" or "blocked".
export function actionVerb(entry) {
  return ACTIONS[entry.action] ?? entry.action;
}

// The name the action was about, as it was then.
export function actionTarget(entry) {
  return entry.details?.name ?? entry.details?.nickname ?? "";
}

// Oct 28, 2026, or Oct 28 with short.
export function formatDate(value, { short = false } = {}) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(short ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}
