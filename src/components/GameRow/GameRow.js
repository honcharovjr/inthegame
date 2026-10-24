import Chip from "@/components/Chip/Chip";
import { ClockIcon, UsersIcon } from "@/components/icons";
import { findGameType } from "@/lib/games/types";
import styles from "./GameRow.module.css";

function formatPlayers(game) {
  return game.min_players === game.max_players
    ? `${game.min_players}`
    : `${game.min_players}-${game.max_players}`;
}

export default function GameRow({ game }) {
  const type = findGameType(game.type);

  return (
    <li className={styles.row}>
      <div className={`${styles.tile} ${styles[type.tone]}`}>
        {game.name.charAt(0).toUpperCase()}
      </div>
      <div className={styles.text}>
        <div className={styles.name}>{game.name}</div>
        <div className={styles.chips}>
          <Chip size="s">
            <UsersIcon />
            {formatPlayers(game)}
          </Chip>
          {game.typical_duration_min && (
            <Chip size="s">
              <ClockIcon />
              {game.typical_duration_min} min
            </Chip>
          )}
          {game.is_classic && (
            <Chip size="s" tone="primary">
              Classic
            </Chip>
          )}
          {game.created_by && (
            <Chip size="s" tone="violet">
              Custom
            </Chip>
          )}
          <Chip size="s" tone={type.tone}>
            {type.label}
          </Chip>
        </div>
      </div>
    </li>
  );
}
