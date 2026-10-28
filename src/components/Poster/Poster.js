import Die from "@/components/Die/Die";
import styles from "./Poster.module.css";

// The loud block that opens a page, in the style of the login screen: a
// colour, giant words rising one by one, and slowly floating shapes and a die.
// tone: "yellow", "ink" or "turquoise". headline: plain text, split into
// words for the animation. children: anything under the headline.
export default function Poster({ tone = "yellow", kicker, headline, face = 5, children, className = "" }) {
  const words = headline.split(" ");

  return (
    <section className={`${styles.poster} ${styles[tone]} ${className}`}>
      <div className={styles.shapes} aria-hidden="true">
        <span className={styles.circle} />
        <span className={styles.square} />
        <Die face={face} size={78} className={styles.floatDie} />
      </div>
      {kicker && <p className={styles.kicker}>{kicker}</p>}
      <h1 className={styles.headline} aria-label={headline}>
        {words.map((word, index) => (
          <span key={index}>
            <span className={styles.word} style={{ "--w": index }} aria-hidden="true">
              {word}
            </span>
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </h1>
      {children && <div className={styles.body}>{children}</div>}
    </section>
  );
}
