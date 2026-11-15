import { BETS, START_CHIPS } from "@/lib/games/blackjack/rules";
import ui from "../shared/play.module.css";

function Line({ name, need, value }) {
  return (
    <div className={ui.ruleLine}>
      <strong>{name}</strong>
      <span>{need}</span>
      <span className={ui.ruleValue}>{value}</span>
    </div>
  );
}

// The rules pop-up tabs for Blackjack, like the ones for Yahtzee.
export function blackjackRules() {
  return [
    {
      label: "Basics",
      content: (
        <>
          <section className={ui.ruleSection}>
            <h3>Goal</h3>
            <p>Beat the dealer: finish closer to 21 than the dealer without going over.</p>
          </section>
          <section className={ui.ruleSection}>
            <h3>Card values</h3>
            <div>
              <Line name="2 to 10" need="As printed" value="2–10" />
              <Line name="J, Q, K" need="Face cards" value="10" />
              <Line name="Ace" need="Whatever helps the hand" value="1 or 11" />
            </div>
          </section>
          <section className={ui.ruleSection}>
            <h3>Your move</h3>
            <div>
              <Line name="Hit" need="Take one more card" value="H" />
              <Line name="Stand" need="Keep your hand" value="S" />
              <Line name="Double" need="Double the bet, take exactly one card" value="D" />
              <Line name="Split" need="Turn a pair into two hands, once" value="P" />
            </div>
            <p>Double only on your first two cards. Split aces get one card each.</p>
          </section>
        </>
      ),
    },
    {
      label: "Payouts",
      content: (
        <>
          <section className={ui.ruleSection}>
            <h3>Results</h3>
            <div>
              <Line name="Blackjack" need="An ace and a 10 as your first two cards" value="3:2" />
              <Line name="Win" need="Closer to 21 than the dealer" value="1:1" />
              <Line name="Push" need="The same total as the dealer" value="bet back" />
              <Line name="Bust" need="Over 21" value="lose" />
            </div>
          </section>
          <section className={ui.ruleSection}>
            <h3>The dealer</h3>
            <p>
              The dealer shows one card until everyone has played, then draws to 17 and stands on every 17. No
              insurance and no surrender.
            </p>
          </section>
        </>
      ),
    },
    {
      label: "Chips",
      content: (
        <>
          <section className={ui.ruleSection}>
            <h3>Betting</h3>
            <p>
              Everyone starts with {START_CHIPS.toLocaleString("en-US")} chips. Add chips of {BETS.join(", ")} to your
              bet, or go all in. Your bet carries over to the next round while you can afford it.
            </p>
          </section>
          <section className={ui.ruleSection}>
            <h3>The end</h3>
            <p>
              A player out of chips sits out. The game ends when everyone is out, or when you end it after a round.
              Chips are just for fun; games on one device are not saved.
            </p>
          </section>
        </>
      ),
    },
  ];
}
