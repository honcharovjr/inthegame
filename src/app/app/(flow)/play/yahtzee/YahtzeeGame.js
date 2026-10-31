"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import Die from "@/components/Die/Die";
import UserText from "@/components/UserText/UserText";
import {
  ROUNDS,
  currentPlayer,
  hasRolled,
  isOver,
  isValidGame,
  isYahtzee,
  newGame,
  options,
  roll,
  round,
  score,
  toggleHold,
} from "@/lib/games/yahtzee/rules";
import { playRoll, playYahtzee } from "../shared/feedback";
import { RulesButton, SoundButton } from "../shared/GameButtons";
import Handoff from "../shared/Handoff";
import InviteScreen from "../shared/InviteScreen";
import ModeScreen from "../shared/ModeScreen";
import { SetupScreen, usePlayerSetup } from "../shared/PlayerSetup";
import ui from "../shared/play.module.css";
import { createGameStore } from "../shared/store";
import YahtzeeBoard, { LABELS } from "./YahtzeeBoard";
import YahtzeeResults from "./YahtzeeResults";
import { yahtzeeRules } from "./YahtzeeRules";
import styles from "./yahtzee.module.css";

// The game in progress lives in the browser. Cleared when the game ends.
const store = createGameStore("itg.yahtzee", isValidGame);

// Yahtzee in the app: solo, with friends passing one phone, or by invite
// with friends on their own devices (the invite opens an online room).
// Results are not saved to history or ratings yet.
export default function YahtzeeGame({ profile, initialGuests, teams, maxPlayers }) {
  // mode | setup | invite | play | over
  const [stage, setStage] = useState("mode");
  const raw = useSyncExternalStore(store.subscribe, store.readRaw, () => null);
  const stored = store.parse(raw, profile.id);
  const setup = usePlayerSetup({ profile, initialGuests, teams, maxPlayers });
  const { lineup, teamId, setTeamId } = setup;

  // Play
  const [participants, setParticipants] = useState([]);
  const [game, setGame] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const [rollId, setRollId] = useState(0);
  // Which dice moved in the last roll, so only they tumble.
  const [moved, setMoved] = useState([]);
  const [flash, setFlash] = useState(false);

  // Keep the game in the browser after every move, and forget it once over.
  useEffect(() => {
    if (stage === "over") store.write(null);
    else if (stage === "play" && game) {
      store.write({ profileId: profile.id, participants, teamId, game });
    }
  }, [stage, game, participants, teamId, profile.id]);

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
    begin(lineup, newGame(lineup.map((person) => person.key)), teamId);
  }

  function resume() {
    begin(stored.participants, stored.game, stored.teamId ?? null);
  }

  function discard() {
    store.write(null);
  }

  function rematch() {
    begin(participants, newGame(participants.map((person) => person.key)), teamId);
  }

  const person = (key) => participants.find((item) => item.key === key);

  function doRoll() {
    const next = roll(game);
    setMoved(hasRolled(game) ? game.held.map((held) => !held) : game.dice.map(() => true));
    setGame(next);
    setRollId((id) => id + 1);
    playRoll();
    if (isYahtzee(next.dice)) {
      playYahtzee();
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
  }

  function doScore(category) {
    const who = currentPlayer(game);
    const points = options(game.sheets[who], game.dice)[category];
    const next = score(game, category);
    setGame(next);
    if (isOver(next)) {
      setStage("over");
    } else if (participants.length > 1) {
      setHandoff({ who, category, points });
    }
  }

  if (stage === "mode") {
    return (
      <ModeScreen
        title="Yahtzee"
        soloArt={<Die face={1} size={44} className={ui.modeDie} />}
        soloText="Just you and the dice. Chase your best score."
        maxPlayers={maxPlayers}
        onSolo={startSolo}
        onPhone={() => setStage("setup")}
        onInvite={() => setStage("invite")}
        resume={
          stored && {
            participants: stored.participants,
            progress: `round ${round(stored.game)} of ${ROUNDS}`,
            onContinue: resume,
            onDiscard: discard,
          }
        }
      />
    );
  }

  if (stage === "invite") {
    return (
      <InviteScreen title="Yahtzee" gameKey="yahtzee" teams={teams} maxPlayers={maxPlayers} onBack={() => setStage("mode")} />
    );
  }

  if (stage === "setup") {
    return <SetupScreen title="Yahtzee" setup={setup} onBack={() => setStage("mode")} onStart={start} />;
  }

  if (stage === "over") {
    return (
      <main className={ui.page}>
        <YahtzeeResults game={game} participants={participants} meKey="me" onBack={() => setStage("mode")}>
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
        </YahtzeeResults>
      </main>
    );
  }

  // Play
  const next = handoff ? person(currentPlayer(game)) : null;

  return (
    <main className={ui.page}>
      <YahtzeeBoard
        game={game}
        participants={participants}
        meKey="me"
        moved={moved}
        rollId={rollId}
        onRoll={doRoll}
        onHold={(index) => setGame(toggleHold(game, index))}
        onScore={doScore}
        actions={
          <>
            <RulesButton title="How to play Yahtzee" tabs={yahtzeeRules()} />
            <SoundButton />
          </>
        }
      />

      {flash && (
        <div className={styles.flash} aria-live="polite">
          Yahtzee!
        </div>
      )}

      {handoff && next && (
        <Handoff
          next={next}
          onReady={() => setHandoff(null)}
          message={
            <>
              {handoff.who === "me" ? "You" : <UserText>{person(handoff.who).name}</UserText>} scored{" "}
              <strong>{handoff.points}</strong> in {LABELS[handoff.category]}
            </>
          }
        />
      )}
    </main>
  );
}
