import { ClockIcon, UsersIcon } from "@/components/icons";
import styles from "./GameMeta.module.css";

function formatPlayers(game) {
  return game.min_players === game.max_players
    ? `${game.min_players}`
    : `${game.min_players}-${game.max_players}`;
}

// How many play and how long it takes, as two plain facts with different
// colours: players in turquoise, time in grey. Chips stay for labels.
export default function GameMeta({ game }) {
  return (
    <span className={styles.meta}>
      <span className={styles.players} data-tip="Players" data-tip-pos="below">
        <UsersIcon size={15} />
        {formatPlayers(game)}
      </span>
      {game.typical_duration_min && (
        <span className={styles.time} data-tip="Typical time" data-tip-pos="below">
          <ClockIcon size={15} />
          {game.typical_duration_min} min
        </span>
      )}
    </span>
  );
}
