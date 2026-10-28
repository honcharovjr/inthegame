import Chip from "@/components/Chip/Chip";
import GameMeta from "@/components/GameMeta/GameMeta";
import { GameName } from "@/components/UserText/UserText";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
import styles from "./GameRow.module.css";

export default function GameRow({ game }) {
  const type = findGameType(game.type);

  return (
    <li className={styles.row}>
      <div className={`${styles.tile} ${styles[type.tone]}`} aria-hidden="true">
        {gameEmoji(game)}
      </div>
      <div className={styles.text}>
        <div className={styles.name}>
          <GameName game={game} />
        </div>
        <GameMeta game={game} />
        <div className={styles.chips}>
          {game.is_classic && (
            <Chip size="s" tone="turquoise">
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
