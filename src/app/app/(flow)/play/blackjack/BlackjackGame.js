"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import PlayingCard from "@/components/PlayingCard/PlayingCard";
import { activeHand, isOver, isValidGame, newGame, nextRound, placeBet } from "@/lib/games/blackjack/rules";
import { playBlackjack, playCard, playChip } from "../shared/feedback";
import { RulesButton, SoundButton } from "../shared/GameButtons";
import Handoff from "../shared/Handoff";
import ModeScreen from "../shared/ModeScreen";
import { SetupScreen, usePlayerSetup } from "../shared/PlayerSetup";
import ui from "../shared/play.module.css";
import { createGameStore } from "../shared/store";
import BlackjackBoard from "./BlackjackBoard";
import BlackjackResults from "./BlackjackResults";
import { blackjackRules } from "./BlackjackRules";
import styles from "./blackjack.module.css";

// The game in progress lives in the browser. Cleared when the game ends.
const store = createGameStore("itg.blackjack", isValidGame);

// Blackjack in the app: solo against the dealer, or with friends passing one
// phone. Chips are just for fun; nothing is saved to history or ratings.
// Built like YahtzeeGame: this file keeps the stages and the moves, the
// board, the results and the rules live in their own files.
export default function BlackjackGame({ profile, initialGuests, teams, maxPlayers }) {
  // mode | setup | play | over
  const [stage, setStage] = useState("mode");
  const raw = useSyncExternalStore(store.subscribe, store.readRaw, () => null);
  const stored = store.parse(raw, profile.id);
  const setup = usePlayerSetup({ profile, initialGuests, teams, maxPlayers });
  const { lineup, teamId, setTeamId } = setup;

  // Play
  const [participants, setParticipants] = useState([]);
  const [game, setGame] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const [flash, setFlash] = useState(false);

  // Keep the game in the browser after every move, and forget it once over.
  useEffect(() => {
    if (stage === "over") store.write(null);
    else if (stage === "play" && game) {
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
    setStage(isOver(nextGame) ? "over" : "play");
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

  function bet(key, amount) {
    setGame((g) => placeBet(g, key, typeof amount === "function" ? amount(g.bets[key] ?? 0) : amount));
    playChip();
  }

  // Plays a move. With friends, the phone is passed when the turn moves to
  // another player. A blackjack in the round gets a cheer, like a Yahtzee.
  function play(move) {
    const before = activeHand(game)?.owner ?? null;
    const next = move(game);
    setGame(next);
    if (next !== game) playCard();
    const after = activeHand(next)?.owner ?? null;
    if (multi && after && after !== before) setHandoff({ who: after });
    if (game.phase !== "done" && next.phase === "done" && next.hands.some((hand) => hand.result === "blackjack")) {
      playBlackjack();
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
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
    return (
      <main className={ui.page}>
        <BlackjackResults game={game} participants={participants} meKey="me" onBack={() => setStage("mode")}>
          <div className={ui.endActions}>
            <button type="button" className={`${ui.primary} ${ui.big}`} onClick={rematch}>
              Play again
            </button>
            <button type="button" className={`${ui.ghost} ${ui.big}`} onClick={() => setStage("mode")}>
              New game
            </button>
            {/* The page keeps its state while away, so it opens on the modes next time */}
            <Link href="/app/games/play" className={`${ui.ghost} ${ui.big}`} onClick={() => setStage("mode")}>
              Done
            </Link>
          </div>
        </BlackjackResults>
      </main>
    );
  }

  // Play
  return (
    <main className={ui.page}>
      <BlackjackBoard
        game={game}
        participants={participants}
        meKey="me"
        onBet={bet}
        onMove={play}
        onNextRound={newRound}
        onEnd={() => setStage("over")}
        actions={
          <>
            <RulesButton title="How to play Blackjack" tabs={blackjackRules()} />
            <SoundButton />
          </>
        }
      />

      {flash && (
        <div className={styles.flash} aria-live="polite">
          Blackjack!
        </div>
      )}

      {handoff && person(handoff.who) && <Handoff next={person(handoff.who)} onReady={() => setHandoff(null)} />}
    </main>
  );
}
