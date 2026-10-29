// Keeps a game in progress in the browser, so a reload or a trip to another
// tab never loses it. One store per game, read with useSyncExternalStore.
export function createGameStore(key, isValidGame) {
  const listeners = new Set();

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function readRaw() {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  // The stored game of this player, or null.
  function parse(raw, profileId) {
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw);
      if (stored?.profileId === profileId && isValidGame(stored.game)) return stored;
    } catch {
      // Something old or broken. Start fresh.
    }
    return null;
  }

  function write(value) {
    try {
      if (value) window.localStorage.setItem(key, JSON.stringify(value));
      else window.localStorage.removeItem(key);
    } catch {
      // Without storage the game still works, it just won't survive a reload.
    }
    listeners.forEach((listener) => listener());
  }

  return { subscribe, readRaw, parse, write };
}
