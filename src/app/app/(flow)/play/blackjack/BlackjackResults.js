import { useEffect } from "react";
import Avatar from "@/components/Avatar/Avatar";
import PlayingCard from "@/components/PlayingCard/PlayingCard";
import UserText from "@/components/UserText/UserText";
import { track } from "@/lib/analytics";
import { standings } from "@/lib/games/blackjack/rules";
import TopBar from "../shared/TopBar";
import ui from "../shared/play.module.css";
import styles from "./blackjack.module.css";

// The end of a Blackjack game, built like the Yahtzee results: a fan of
// cards, the headline, then everyone by chips. children are the buttons
// below, such as play again. onBack replaces the back link.
export default function BlackjackResults({ game, participants, meKey, onBack, children }) {
  const ranked = standings(game);
  const top = ranked[0];
  const leaders = ranked.filter((item) => item.chips === top.chips);
  const multi = participants.length > 1;
  const person = (key) => participants.find((item) => item.key === key);
  const players = participants.length;

  // Counted once, when the results first show.
  useEffect(() => {
    track("game_played", { game: "blackjack", players });
  }, [players]);

  const headline = !multi
    ? top.chips > 0
      ? `You leave with ${top.chips} chips`
      : "Out of chips!"
    : top.chips === 0
      ? "The house wins!"
      : leaders.length > 1
        ? "A tie at the top!"
        : top.key === meKey
          ? "You win!"
          : <><UserText>{person(top.key).name}</UserText> wins!</>;

  return (
    <div className={ui.column}>
      <TopBar title="Blackjack" backHref="/app/games/play" onBack={onBack} />
      <div className={styles.fan} aria-hidden="true">
        {["AS", "KH", "QD", "JC", "10S"].map((card, index) => (
          <span key={card} className={styles.fanCard}>
            <PlayingCard card={card} width={44} dealt delay={index * 0.1} />
          </span>
        ))}
      </div>
      <h1 className={ui.headline}>{headline}</h1>

      <ol className={`${ui.results} stagger`}>
        {ranked.map((item, index) => {
          const who = person(item.key);
          const first = item.chips > 0 && item.chips === top.chips;
          return (
            <li key={item.key} className={`${ui.resultRow} ${first ? ui.resultWin : ""}`}>
              {multi && <span className={ui.place}>{index + 1}</span>}
              <Avatar name={who.name} size={44} color={who.color} registered={who.registered} character={who.character} />
              <span className={ui.resultText}>
                <span className={ui.resultName}>{item.key === meKey ? "You" : <UserText>{who.name}</UserText>}</span>
                <span className={ui.resultMeta}>{game.round} rounds played</span>
              </span>
              <span className={ui.resultTotal}>{item.chips}</span>
            </li>
          );
        })}
      </ol>

      <p className={ui.note}>Games on one device are not saved to your history.</p>
      {children}
    </div>
  );
}
