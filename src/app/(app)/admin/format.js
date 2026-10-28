// Text helpers for the admin pages.

const ACTIONS = {
  "game.add": "added",
  "game.edit": "edited",
  "game.delete": "deleted",
  "game.promote": "added to the catalog",
  "player.block": "blocked",
  "player.unblock": "unblocked",
};

// "added Uno", "blocked Anna"
export function describeAction(entry) {
  const verb = ACTIONS[entry.action] ?? entry.action;
  const name = entry.details?.name ?? entry.details?.nickname ?? "";
  return `${verb} ${name}`.trim();
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
