import Avatar from "@/components/Avatar/Avatar";
import Die from "@/components/Die/Die";
import UserText from "@/components/UserText/UserText";
import { finalScores, totals } from "@/lib/games/yahtzee/rules";
import { placesFromScores } from "@/lib/sessions/places";
import TopBar from "../shared/TopBar";
import ui from "../shared/play.module.css";
import styles from "./yahtzee.module.css";

// The end of a Yahtzee game: the winner, then everyone by place with their
// sections. Shared by the game on one device and the online game.
// children are the buttons below, such as play again. onBack replaces the
// back link, for example to return to choosing how to play. note says
// whether the result is saved.
export default function YahtzeeResults({
  game,
  participants,
  meKey,
  onBack,
  note = "Games on one device are not saved to your history.",
  children,
}) {
  const scores = finalScores(game);
  const places = placesFromScores(scores);
  const ranked = participants
    .filter((item) => item.key in scores)
    .sort((a, b) => places[a.key] - places[b.key]);
  const winners = ranked.filter((item) => places[item.key] === 1);
  const headline =
    ranked.length === 1
      ? `You scored ${scores[meKey]}!`
      : winners.length > 1
        ? "A tie at the top!"
        : winners[0].key === meKey
          ? "You win!"
          : <><UserText>{winners[0].name}</UserText> wins!</>;

  return (
    <div className={ui.column}>
      <TopBar title="Yahtzee" backHref="/app/games/play" onBack={onBack} />
      <div className={styles.confetti} aria-hidden="true">
        {[6, 5, 4, 3, 2, 1].map((face, index) => (
          <Die key={face} face={face} size={34} className={styles.confettiDie} style={{ "--i": index }} />
        ))}
      </div>
      <h1 className={ui.headline}>{headline}</h1>

      <ol className={`${ui.results} stagger`}>
        {ranked.map((item) => {
          const sum = totals(game.sheets[item.key]);
          const first = places[item.key] === 1;
          return (
            <li key={item.key} className={`${ui.resultRow} ${first ? ui.resultWin : ""}`}>
              {ranked.length > 1 && <span className={ui.place}>{places[item.key]}</span>}
              <Avatar name={item.name} size={44} color={item.color} registered={item.registered} character={item.character} />
              <span className={ui.resultText}>
                <span className={ui.resultName}>
                  {item.key === meKey ? "You" : <UserText>{item.name}</UserText>}
                </span>
                <span className={ui.resultMeta}>
                  Upper {sum.upper}
                  {sum.upperBonus ? ` +${sum.upperBonus}` : ""} · Lower {sum.lower}
                  {sum.yahtzeeBonus ? ` · Bonus ${sum.yahtzeeBonus}` : ""}
                </span>
              </span>
              <span className={ui.resultTotal}>{sum.total}</span>
            </li>
          );
        })}
      </ol>

      <p className={ui.note}>{note}</p>
      {children}
    </div>
  );
}
