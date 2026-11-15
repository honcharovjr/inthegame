import MetaLine from "@/components/MetaLine/MetaLine";
import styles from "./SessionRow.module.css";

// One played session in a list, the same on History and in the team and
// personal histories. tone: the colour of the game tile. chips: a node with
// chips, or nothing. meta: the facts for the quiet line (see MetaLine).
// result: the player's result in words, won: it is a win. picked: the row
// opened from a link. actions: buttons at the end, such as edit and delete.
export default function SessionRow({ id, emoji, tone = "default", name, chips, meta, result, won, picked, actions }) {
  return (
    <li id={id ? `session-${id}` : undefined} className={`${styles.row} ${picked ? styles.picked : ""}`}>
      <span className={`${styles.tile} ${styles[`tile_${tone}`]}`}>{emoji}</span>
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        {chips && <span className={styles.chips}>{chips}</span>}
        <MetaLine items={meta} />
      </span>
      {result && <span className={`${styles.result} ${won ? styles.resultWon : ""}`}>{result}</span>}
      {actions && <span className={styles.actions}>{actions}</span>}
    </li>
  );
}
