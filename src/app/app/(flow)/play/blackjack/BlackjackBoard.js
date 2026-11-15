"use client";

import { useEffect } from "react";
import Avatar from "@/components/Avatar/Avatar";
import PlayingCard from "@/components/PlayingCard/PlayingCard";
import UserText from "@/components/UserText/UserText";
import {
  BETS,
  activeHand,
  canDeal,
  canDouble,
  canSplit,
  deal,
  double,
  handValue,
  hit,
  split,
  stand,
} from "@/lib/games/blackjack/rules";
import TopBar from "../shared/TopBar";
import ui from "../shared/play.module.css";
import styles from "./blackjack.module.css";

// Seconds between cards in the opening deal, and between the dealer's cards.
const DEAL_STEP = 0.15;
const DEALER_STEP = 0.45;

const RESULTS = {
  blackjack: "Blackjack!",
  win: "Win",
  push: "Push",
  lose: "Lose",
  bust: "Bust",
};

// A total as players say it: a soft hand shows both counts, such as 7 / 17.
function totalText(cards) {
  const { total, soft } = handValue(cards);
  return soft && total < 21 ? `${total - 10} / ${total}` : String(total);
}

// The Blackjack table, built like the Yahtzee one: a top bar with the round
// and the actions, the felt with the turn line above it and the moves below,
// and a side panel with everyone's chips.
// participants: [{ key, name, color, registered, character }], keyed like
// game.players. meKey is shown as "You". onBet(key, amount) sets a bet;
// amount may be a function of the current bet. onMove(move) plays deal,
// hit, stand, double or split. onNextRound and onEnd follow a finished
// round. actions sit in the top bar.
export default function BlackjackBoard({ game, participants, meKey, onBet, onMove, onNextRound, onEnd, actions }) {
  const person = (key) => participants.find((item) => item.key === key);
  const chipsOf = (key) => game.players.find((item) => item.key === key)?.chips ?? 0;
  const multi = participants.length > 1;
  const current = activeHand(game);
  const hidden = game.phase === "play";
  const seats = participants.length;
  const extraDealer = Math.max(0, game.dealer.length - 2);
  // Results show once the dealer's cards have landed.
  const reveal = 0.5 + extraDealer * DEALER_STEP;
  const dealable = canDeal(game);
  const doublable = game.phase === "play" && canDouble(game);
  const splittable = game.phase === "play" && canSplit(game);

  // Desktop keys: H hit, S stand, D double, P split; space or enter deals
  // and starts the next round.
  useEffect(() => {
    function onKey(event) {
      if (event.target.closest?.("button, a, input, textarea, select, [role='dialog']")) return;
      const key = event.key.toLowerCase();
      if ((key === " " || key === "enter") && (game.phase === "bet" || game.phase === "done")) {
        event.preventDefault();
        if (game.phase === "bet" && dealable) onMove(deal);
        else if (game.phase === "done") onNextRound();
      } else if (game.phase === "play") {
        if (key === "h") onMove(hit);
        else if (key === "s") onMove(stand);
        else if (key === "d" && doublable) onMove(double);
        else if (key === "p" && splittable) onMove(split);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.phase, dealable, doublable, splittable, onMove, onNextRound]);

  const turn =
    game.phase === "bet" ? (
      multi ? "Place your bets" : "Place a bet"
    ) : game.phase === "play" ? (
      current.owner === meKey ? (
        "Your move"
      ) : (
        <>
          <UserText>{person(current.owner)?.name}</UserText>&apos;s move
        </>
      )
    ) : (
      "Round over"
    );

  const ranked = [...participants].sort((a, b) => chipsOf(b.key) - chipsOf(a.key));

  return (
    <div className={`${ui.column} ${styles.playColumn}`}>
      <TopBar title="Blackjack" backHref="/app/games/play">
        <span className={styles.topRight}>
          <span className={styles.round}>Round {game.round}</span>
          {actions}
        </span>
      </TopBar>

      <div className={styles.layout}>
        <section className={styles.table} aria-label="Table">
          <div className={styles.turnLine}>
            <p className={styles.turn}>{turn}</p>
          </div>

          <div className={styles.felt}>
            <div className={styles.dealer}>
              <div className={styles.handHead}>
                <span className={styles.handName}>Dealer</span>
                {game.dealer.length > 0 && (
                  <span className={styles.total}>
                    {hidden ? totalText(game.dealer.slice(0, 1)) : totalText(game.dealer)}
                  </span>
                )}
              </div>
              <div className={styles.cards}>
                {game.dealer.length === 0 ? (
                  <span className={styles.empty}>Place your bets</span>
                ) : (
                  game.dealer.map((card, index) => (
                    <PlayingCard
                      key={`${game.round}-d${index}`}
                      card={card}
                      faceDown={hidden && index === 1}
                      width={68}
                      dealt
                      delay={index < 2 ? (index * (seats + 1) + seats) * DEAL_STEP : 0.4 + (index - 2) * DEALER_STEP}
                    />
                  ))
                )}
              </div>
              <p className={styles.rule}>Dealer stands on 17 · blackjack pays 3:2</p>
            </div>

            {game.hands.length > 0 && (
              <div className={styles.hands}>
                {game.hands.map((hand, index) => {
                  const owner = person(hand.owner);
                  const seat = participants.findIndex((item) => item.key === hand.owner);
                  const isActive = game.phase === "play" && index === game.active;
                  return (
                    <div
                      key={`${game.round}-h${index}`}
                      className={`${styles.hand} ${isActive ? styles.handActive : ""} ${hand.result ? styles[`hand_${hand.result}`] : ""}`}
                    >
                      <div className={styles.handHead}>
                        <Avatar name={owner.name} size={26} color={owner.color} registered={owner.registered} character={owner.character} />
                        <span className={styles.handName}>
                          {hand.owner === meKey ? "You" : <UserText>{owner.name}</UserText>}
                        </span>
                        <span className={styles.total}>{totalText(hand.cards)}</span>
                      </div>
                      <div className={styles.cards}>
                        {hand.cards.map((card, cardIndex) => (
                          <PlayingCard
                            key={`${game.round}-h${index}-${cardIndex}`}
                            card={card}
                            width={60}
                            dealt
                            delay={cardIndex < 2 && !hand.fromSplit ? (cardIndex * (seats + 1) + seat) * DEAL_STEP : 0}
                          />
                        ))}
                      </div>
                      <div className={styles.handFoot}>
                        <span className={styles.bet}>
                          <span className={styles.betChip} aria-hidden="true" />
                          {hand.bet}
                          {hand.doubled && " · doubled"}
                        </span>
                        {hand.result && (
                          <span className={styles.result} style={{ "--reveal": `${reveal}s` }}>
                            {RESULTS[hand.result]}
                            {hand.payout > hand.bet && ` +${hand.payout - hand.bet}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {game.phase === "bet" && (
            <div className={styles.betting} role="group" aria-label="Bets">
              {participants
                .filter((item) => chipsOf(item.key) > 0)
                .map((item) => {
                  const bet = game.bets[item.key] ?? 0;
                  const chips = chipsOf(item.key);
                  return (
                    <div key={item.key} className={styles.betRow}>
                      <div className={styles.betWho}>
                        <Avatar name={item.name} size={34} color={item.color} registered={item.registered} character={item.character} />
                        <span className={styles.betName}>
                          {item.key === meKey ? "You" : <UserText>{item.name}</UserText>}
                        </span>
                        <span className={styles.betAmount}>{bet}</span>
                      </div>
                      <div className={styles.betChips} role="group" aria-label="Add to the bet">
                        {BETS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className={`${styles.chip} ${styles[`chip${amount}`]}`}
                            disabled={bet >= chips}
                            onClick={() => onBet(item.key, (current) => current + amount)}
                            aria-label={`Add ${amount}`}
                          >
                            {amount}
                          </button>
                        ))}
                        <button type="button" className={styles.allIn} disabled={bet >= chips} onClick={() => onBet(item.key, chips)}>
                          All in
                        </button>
                        <button type="button" className={styles.clear} disabled={bet === 0} onClick={() => onBet(item.key, 0)}>
                          Clear
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className={styles.actions}>
            {game.phase === "bet" && (
              <button type="button" className={`${ui.primary} ${ui.big}`} disabled={!dealable} onClick={() => onMove(deal)}>
                {dealable ? "Deal" : multi ? "Everyone places a bet" : "Place a bet"}
              </button>
            )}

            {game.phase === "play" && (
              <div className={styles.moves}>
                <button type="button" className={`${styles.move} ${styles.hit}`} onClick={() => onMove(hit)}>
                  Hit
                </button>
                <button type="button" className={`${styles.move} ${styles.standMove}`} onClick={() => onMove(stand)}>
                  Stand
                </button>
                <button type="button" className={styles.move} disabled={!doublable} onClick={() => onMove(double)}>
                  Double
                </button>
                <button type="button" className={styles.move} disabled={!splittable} onClick={() => onMove(split)}>
                  Split
                </button>
              </div>
            )}

            {game.phase === "done" && (
              <div className={styles.moves}>
                <button type="button" className={`${ui.primary} ${styles.wide}`} onClick={onNextRound}>
                  Next round
                </button>
                <button type="button" className={ui.ghost} onClick={onEnd}>
                  End game
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className={styles.side} aria-label="Players">
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{multi ? "Chips" : "Your chips"}</h2>
            <ol className={styles.standings}>
              {ranked.map((p, index) => {
                const on = current?.owner === p.key;
                const out = chipsOf(p.key) === 0 && game.phase === "bet";
                return (
                  <li key={p.key} className={`${styles.stand} ${on ? styles.standOn : ""} ${out ? styles.out : ""}`}>
                    <span className={styles.standPlace}>{index + 1}</span>
                    <Avatar name={p.name} size={28} color={p.color} registered={p.registered} character={p.character} />
                    <span className={styles.standName}>{p.key === meKey ? "You" : <UserText>{p.name}</UserText>}</span>
                    <span className={styles.standTotal}>{chipsOf(p.key)}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
