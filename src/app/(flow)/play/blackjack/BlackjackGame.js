"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
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
  isOver,
  isValidGame,
  newGame,
  nextRound,
  placeBet,
  split,
  stand,
  standings,
} from "@/lib/games/blackjack/rules";
import Handoff from "../shared/Handoff";
import ModeScreen from "../shared/ModeScreen";
import { SetupScreen, usePlayerSetup } from "../shared/PlayerSetup";
import TopBar from "../shared/TopBar";
import ui from "../shared/play.module.css";
import { createGameStore } from "../shared/store";
import styles from "./blackjack.module.css";

// The game in progress lives in the browser. Cleared when the game ends.
const store = createGameStore("itg.blackjack", isValidGame);

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

// Blackjack in the app: solo against the dealer, or with friends passing one
// phone. Chips are just for fun; nothing is saved to history or ratings.
export default function BlackjackGame({ profile, initialGuests, teams, maxPlayers }) {
  // mode | setup | table | over
  const [stage, setStage] = useState("mode");
  const raw = useSyncExternalStore(store.subscribe, store.readRaw, () => null);
  const stored = store.parse(raw, profile.id);
  const setup = usePlayerSetup({ profile, initialGuests, teams, maxPlayers });
  const { lineup, teamId, setTeamId } = setup;

  const [participants, setParticipants] = useState([]);
  const [game, setGame] = useState(null);
  const [handoff, setHandoff] = useState(null);

  // Keep the game in the browser after every move, and forget it once over.
  useEffect(() => {
    if (stage === "over") store.write(null);
    else if (stage === "table" && game) {
      store.write({ profileId: profile.id, participants, teamId, game });
    }
  }, [stage, game, participants, teamId, profile.id]);

  const person = (key) => participants.find((item) => item.key === key);
  const multi = participants.length > 1;

  function begin(players, nextGame, nextTeamId) {
    setParticipants(players);
    setTeamId(nextTeamId);
    setGame(nextGame);
    setHandoff(null);
    setStage(isOver(nextGame) ? "over" : "table");
  }

  function startSolo() {
    begin([setup.me], newGame(["me"]), null);
  }

  function start() {
    begin(lineup, newGame(lineup.map((item) => item.key)), teamId);
  }

  function resume() {
    begin(stored.participants, stored.game, stored.teamId ?? null);
  }

  function discard() {
    store.write(null);
  }

  function rematch() {
    begin(participants, newGame(participants.map((item) => item.key)), teamId);
  }

  // Plays a move. With friends, the phone is passed when the turn moves to
  // another player.
  function play(move) {
    const before = activeHand(game)?.owner ?? null;
    const next = move(game);
    setGame(next);
    const after = activeHand(next)?.owner ?? null;
    if (multi && after && after !== before) setHandoff({ who: after });
  }

  function newRound() {
    const next = nextRound(game);
    setGame(next);
    if (isOver(next)) setStage("over");
  }

  if (stage === "mode") {
    return (
      <ModeScreen
        title="Blackjack"
        soloArt={
          <span className={styles.modeCards} aria-hidden="true">
            <span className={styles.modeCardA}>
              <PlayingCard card="AS" width={46} />
            </span>
            <span className={styles.modeCardB}>
              <PlayingCard card="KH" width={46} />
            </span>
          </span>
        }
        soloText="You against the dealer. Start with 1,000 chips and see how far they go."
        maxPlayers={maxPlayers}
        onSolo={startSolo}
        onPhone={() => setStage("setup")}
        resume={
          stored && {
            participants: stored.participants,
            progress: `round ${stored.game.round}`,
            onContinue: resume,
            onDiscard: discard,
          }
        }
      />
    );
  }

  if (stage === "setup") {
    return <SetupScreen title="Blackjack" setup={setup} onBack={() => setStage("mode")} onStart={start} />;
  }

  if (stage === "over") {
    const ranked = standings(game);
    const top = ranked[0];
    const leaders = ranked.filter((item) => item.chips === top.chips);
    const headline = !multi
      ? top.chips > 0
        ? `You leave with ${top.chips} chips`
        : "Out of chips!"
      : top.chips === 0
        ? "The house wins!"
        : leaders.length > 1
          ? "A tie at the top!"
          : top.key === "me"
            ? "You win!"
            : <><UserText>{person(top.key).name}</UserText> wins!</>;

    return (
      <main className={ui.page}>
        <div className={ui.column}>
          <TopBar title="Blackjack" backHref="/games/play" />
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
                    <span className={ui.resultName}>
                      {item.key === "me" ? "You" : <UserText>{who.name}</UserText>}
                    </span>
                    <span className={ui.resultMeta}>{game.round} rounds played</span>
                  </span>
                  <span className={ui.resultTotal}>{item.chips}</span>
                </li>
              );
            })}
          </ol>

          <p className={ui.note}>In-app games are not saved to your history yet.</p>

          <div className={ui.endActions}>
            <button type="button" className={`${ui.primary} ${ui.big}`} onClick={rematch}>
              Play again
            </button>
            <Link href="/games/play" className={`${ui.ghost} ${ui.big}`}>
              Done
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // The table
  const current = activeHand(game);
  const hidden = game.phase === "play";
  const seats = participants.length;
  const extraDealer = Math.max(0, game.dealer.length - 2);
  // Results show once the dealer's cards have landed.
  const reveal = 0.5 + extraDealer * DEALER_STEP;
  const chipsOf = (key) => game.players.find((item) => item.key === key)?.chips ?? 0;

  return (
    <main className={ui.page}>
      <div className={`${ui.column} ${styles.tableColumn}`}>
        <TopBar title="Blackjack" backHref="/games/play">
          <span className={styles.round}>Round {game.round}</span>
        </TopBar>

        <div className={ui.players}>
          {participants.map((item) => (
            <span
              key={item.key}
              className={`${ui.player} ${current?.owner === item.key ? ui.playerActive : ""} ${chipsOf(item.key) === 0 && game.phase === "bet" ? styles.out : ""}`}
            >
              <Avatar name={item.name} size={30} color={item.color} registered={item.registered} character={item.character} />
              <span className={ui.playerName}>
                {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
              </span>
              <span className={ui.playerTotal}>{chipsOf(item.key)}</span>
            </span>
          ))}
        </div>

        <section className={styles.felt} aria-label="Table">
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
                        {hand.owner === "me" ? "You" : <UserText>{owner.name}</UserText>}
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
        </section>

        {game.phase === "bet" && (
          <section className={styles.betting} aria-label="Bets">
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
                        {item.key === "me" ? "You" : <UserText>{item.name}</UserText>}
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
                          onClick={() => setGame((g) => placeBet(g, item.key, (g.bets[item.key] ?? 0) + amount))}
                          aria-label={`Add ${amount}`}
                        >
                          {amount}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={styles.allIn}
                        disabled={bet >= chips}
                        onClick={() => setGame((g) => placeBet(g, item.key, chips))}
                      >
                        All in
                      </button>
                      <button
                        type="button"
                        className={styles.clear}
                        disabled={bet === 0}
                        onClick={() => setGame((g) => placeBet(g, item.key, 0))}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                );
              })}
          </section>
        )}

        <div className={styles.actions}>
          {game.phase === "bet" && (
            <button type="button" className={`${ui.primary} ${ui.big}`} disabled={!canDeal(game)} onClick={() => play(deal)}>
              {canDeal(game) ? "Deal" : multi ? "Everyone places a bet" : "Place a bet"}
            </button>
          )}

          {game.phase === "play" && (
            <>
              <p className={styles.turn}>
                {current.owner === "me" ? "Your move" : <><UserText>{person(current.owner).name}</UserText>&apos;s move</>}
              </p>
              <div className={styles.moves}>
                <button type="button" className={`${styles.move} ${styles.hit}`} onClick={() => play(hit)}>
                  Hit
                </button>
                <button type="button" className={`${styles.move} ${styles.stand}`} onClick={() => play(stand)}>
                  Stand
                </button>
                <button type="button" className={styles.move} disabled={!canDouble(game)} onClick={() => play(double)}>
                  Double
                </button>
                <button type="button" className={styles.move} disabled={!canSplit(game)} onClick={() => play(split)}>
                  Split
                </button>
              </div>
            </>
          )}

          {game.phase === "done" && (
            <div className={styles.moves}>
              <button type="button" className={`${ui.primary} ${styles.wide}`} onClick={newRound}>
                Next round
              </button>
              <button type="button" className={ui.ghost} onClick={() => setStage("over")}>
                End game
              </button>
            </div>
          )}
        </div>
      </div>

      {handoff && person(handoff.who) && (
        <Handoff next={person(handoff.who)} onReady={() => setHandoff(null)} />
      )}
    </main>
  );
}
