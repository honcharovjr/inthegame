// Text a player typed, such as a nickname, a guest or team name, a custom
// game name or an email. The app shows everything in lowercase; this keeps
// the player's own case.
export default function UserText({ children }) {
  return <span className="keep-case">{children}</span>;
}

// A game name. Catalog games follow the app's lowercase; a custom game was
// named by a player, so it keeps its case. Needs the game's created_by.
export function GameName({ game, fallback = "Game" }) {
  if (!game?.name) return fallback;
  return game.created_by ? <UserText>{game.name}</UserText> : game.name;
}
