import { UPPER_BONUS, UPPER_BONUS_AT, YAHTZEE_BONUS } from "@/lib/games/yahtzee/rules";
import ui from "../shared/play.module.css";

const LOWER_RULES = [
  ["3 of a kind", "3 dice the same", "sum"],
  ["4 of a kind", "4 dice the same", "sum"],
  ["Full house", "3 + 2 of a kind", "25"],
  ["Small straight", "4 in a row", "30"],
  ["Large straight", "5 in a row", "40"],
  ["Yahtzee", "5 of a kind", "50"],
  ["Chance", "Any dice", "sum"],
];

function Line({ name, need, value }) {
  return (
    <div className={ui.ruleLine}>
      <strong>{name}</strong>
      <span>{need}</span>
      <span className={ui.ruleValue}>{value}</span>
    </div>
  );
}

// The rules pop-up tabs for Yahtzee. online adds the timer rules.
export function yahtzeeRules({ online = false } = {}) {
  const tabs = [
    {
      label: "Basics",
      content: (
        <>
          <section className={ui.ruleSection}>
            <h3>Goal</h3>
            <p>Score the most points in 13 rounds. Each round you fill one box on your sheet.</p>
          </section>
          <section className={ui.ruleSection}>
            <h3>Your turn</h3>
            <p>
              Roll up to 3 times. Between rolls, tap dice to hold them. Then tap a score to fill a box. You have to
              fill one box every turn, even with a 0.
            </p>
          </section>
        </>
      ),
    },
    {
      label: "Scoring",
      content: (
        <>
          <section className={ui.ruleSection}>
            <h3>Upper section</h3>
            <div>
              <Line name="1s to 6s" need="Only that number counts" value="sum" />
              <Line name="Bonus" need={`${UPPER_BONUS_AT} or more in 1s to 6s`} value={`+${UPPER_BONUS}`} />
            </div>
          </section>
          <section className={ui.ruleSection}>
            <h3>Lower section</h3>
            <div>
              {LOWER_RULES.map(([name, need, value]) => (
                <Line key={name} name={name} need={need} value={value} />
              ))}
            </div>
          </section>
          <section className={ui.ruleSection}>
            <h3>More Yahtzees</h3>
            <p>
              Each extra Yahtzee gives +{YAHTZEE_BONUS} if your Yahtzee box has 50. You still fill a box: the
              matching upper box if it is open, otherwise any lower box at full points.
            </p>
          </section>
        </>
      ),
    },
  ];
  if (online) {
    tabs.push({
      label: "Online",
      content: (
        <>
          <section className={ui.ruleSection}>
            <h3>Time</h3>
            <p>
              Each turn has 60 seconds. When they run out, the host can wait for the player or remove them. If the
              host does nothing for another 60 seconds, the turn is skipped and the dice go into the best box.
            </p>
          </section>
          <section className={ui.ruleSection}>
            <h3>Ending early</h3>
            <p>
              The host can end the game at any time; the others can ask the host to. A game that ends early has no
              winner and records nothing.
            </p>
          </section>
        </>
      ),
    });
  }
  return tabs;
}
