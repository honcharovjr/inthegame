"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Character from "@/components/Character/Character";
import UserText from "@/components/UserText/UserText";
import { LINE_PATH, easeOut, ratingAt, seasonActivity, seasonAt } from "@/lib/landing/growth";
import styles from "./landing.module.css";

// Content of the landing page. Names in the demos are made-up players.
const WITHOUT = [
  ["scores on a napkin, gone by monday", "someone wrote the points on a receipt. nobody can find it a week later."],
  ["nobody remembers who won last month", "every game starts from zero, and the arguments start from memory."],
  ["the same friend always says they are the best", "without a record, the loudest voice wins the table."],
];
const WITH = [
  ["every game saved in under a minute", "game, players, winner. friends without an account join as guests."],
  ["ratings settle the argument", "one elo rating per game, like in chess. beat someone stronger and you climb faster."],
  ["a reason to play again next week", "streaks, rivals and achievements keep the group coming back."],
];
const STEPS = [
  ["log it", "pick the game, tap who played, choose the winner."],
  ["watch it grow", "your rating moves after every game, and each one fills your activity."],
  ["beat your friends", "create a team, drop the invite link in your chat, and every game lands on one board."],
];
const HAND = [
  ["rivals", "7–5", "you vs anna", "var(--color-turquoise)", "var(--color-ink)"],
  ["streak", "3", "wins in a row", "var(--color-yellow)", "var(--color-ink)"],
  ["best game", "68%", "win rate in catan", "var(--color-pink)", "var(--color-ink)"],
  ["team", "12", "new in your feed", "var(--color-ink)", "#fff"],
];
const ACHIEVEMENTS = [
  ["first win", "win a session", 1, 1, 1],
  ["hot hand", "win 3 sessions in a row", 2, 2, 3],
  ["giant slayer", "beat a player rated 200 higher than you", 3, 0, 1],
  ["explorer", "play 5 different games", 1, 4, 5],
  ["marathon", "log 5 sessions in one day", 2, 3, 5],
];
const GLOWS = ["rgba(255,225,77,.55)", "rgba(255,79,163,.35)", "rgba(47,214,214,.4)"];
// Three looks from the real character art, each on the background an achievement unlocks.
// The scene draws that background in CSS, so the figure stands on it without a frame.
const LOOKS = [
  {
    name: "dwarf · plate armour",
    scene: "radial-gradient(#ffe14d 1.6px, transparent 2.2px) 0 0 / 26px 26px, radial-gradient(rgba(255,225,77,.45) 1px, transparent 1.6px) 13px 13px / 26px 26px, #2b1d4a",
    unlock: "stars background",
    by: "centurion · 100 sessions played",
    character: { race: "dwarf", skin: "tan", hair: "short", hairColor: "ginger", beard: "braided", eyeColor: "blue", outfit: "plate", outfitColor: "navy", background: "stars" },
  },
  {
    name: "tiefling · robe",
    scene: "radial-gradient(#ff4fa3 3.5px, transparent 4px) 0 0 / 22px 22px, radial-gradient(#2fd6d6 3.5px, transparent 4px) 11px 11px / 22px 22px, #e6e0ff",
    unlock: "confetti background",
    by: "winner's circle · 10 sessions won",
    character: { race: "tiefling", skin: "ember", hair: "long", hairColor: "black", beard: "none", eyeColor: "amber", outfit: "robe", outfitColor: "navy", background: "confetti" },
  },
  {
    name: "orc · fur coat",
    scene: "repeating-conic-gradient(#ff8fc4 0 25%, #ffe0ef 0 50%) 0 0 / 40px 40px",
    unlock: "checker background",
    by: "weekly habit · 4 weeks in a row",
    character: { race: "orc", skin: "moss", hair: "mohawk", hairColor: "black", beard: "none", eyeColor: "red", outfit: "fur", outfitColor: "wine", background: "checker" },
  },
];
const GAMES = {
  dice: ["yahtzee", "farkle", "backgammon", "dominoes"],
  cards: ["durak", "poker", "hearts", "bridge", "rummy", "uno", "blackjack"],
  strategy: ["chess", "go", "catan", "carcassonne", "ticket to ride", "pandemic", "mahjong"],
  party: ["codenames", "dixit", "taboo", "jenga", "scrabble", "monopoly"],
};
const TYPE_BG = { dice: "var(--color-yellow)", cards: "var(--color-pink-soft)", strategy: "var(--color-turquoise)", party: "var(--color-violet-tint)" };
const MARQUEE_A = ["chess", "durak", "poker", "backgammon", "catan", "codenames", "ticket to ride", "uno", "yahtzee", "carcassonne", "mahjong", "scrabble"];
const MARQUEE_B = ["dixit", "go", "hearts", "farkle", "monopoly", "pandemic", "jenga", "bridge", "rummy", "dominoes", "taboo", "blackjack"];
const FEED = [
  ["20:41", "anna rolled five fives · yahtzee! +50", "var(--color-yellow)"],
  ["20:42", "your turn · 60 s", "rgba(255,255,255,.75)"],
  ["20:42", "you scored large straight · 40", "var(--color-turquoise)"],
  ["20:43", "mark scored full house · 25", "rgba(255,255,255,.75)"],
  ["20:58", "game over · you win with 284", "var(--color-pink-soft)"],
  ["20:58", "saved to history · rating +12", "var(--color-turquoise)"],
];
const FAQ = [
  ["do my friends need an account?", "no. add them as guests with just a name. games with a guest stay in your history and count for achievements, but they are not rated."],
  ["how does the rating work?", "every game has its own elo rating, like in chess. you gain more for beating a stronger player and lose less to one. everyone starts at the same number."],
  ["which games can I log?", "30+ games in the catalog, from chess and catan to card games you play without a box. if yours is missing, add it as your own game."],
  ["who can see my games?", "your profile is visible to the members of your teams only."],
  ["can I play without a table?", "yes. play yahtzee and blackjack in the app on one device, or invite your team to online yahtzee. finished online games are saved to your history."],
];
const SEASON = seasonActivity(30, 4);
const HEAT = ["#2a1f2e", "#5a2a48", "#b0145f", "#ff4fa3", "#ffc2df"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const ROLL_TEXT = "in one place";
const REEL_ROW = 72;
const REEL_REPEAT = 6;
const SPIN_MS = 4000;
const GROW_MS = 3200;
const GROW_LOOP = 5200;

const pool = (cat) =>
  cat === "all" ? Object.keys(GAMES).flatMap((type) => GAMES[type].map((name) => [name, type])) : GAMES[cat].map((name) => [name, cat]);

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (change) => {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

// True when the visitor asked for less motion. False on the server.
function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(MOTION_QUERY).matches, () => false);
}

// Runs fn every ms while active is true.
function useEvery(ms, active, fn) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  });
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms, active]);
}

export default function Landing({ contactEmail }) {
  const reduce = useReducedMotion();
  const root = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Headings and leads rise in as they scroll into view.
  useEffect(() => {
    if (reduce || !("IntersectionObserver" in window)) return undefined;
    const items = root.current.querySelectorAll("[data-rv]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(styles.revealed);
          observer.unobserve(entry.target);
        }),
      { threshold: 0.15 },
    );
    items.forEach((item) => {
      item.style.transitionDelay = `${Number(item.dataset.rv) * 90}ms`;
      item.classList.add(styles.reveal);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [reduce]);

  return (
    <div ref={root} className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.headerBar} ${scrolled ? styles.scrolled : ""}`}>
          <span className={styles.brand}>in the game</span>
          <nav aria-label="Main" className={styles.nav}>
            <a href="#how">how it works</a>
            <a href="#games">games</a>
            <a href="#play">play</a>
            <a href="#faq">questions</a>
          </nav>
          <span className={styles.spacer} />
          <Link href="/app" className={`${styles.btn} ${styles.small} btn-secondary`}>
            Log in
          </Link>
          <Link href="/signup" className={`${styles.btn} ${styles.small} btn-primary`}>
            Get started
          </Link>
        </div>
      </header>

      <Hero reduce={reduce} />

      <section aria-label="Games you can log" className={styles.marqueeBox}>
        {[MARQUEE_A, MARQUEE_B].map((names, row) => (
          <div key={row} className={`${styles.marquee} ${row ? styles.back : ""}`}>
            {/* Each row twice, so the scroll loops without a jump */}
            {[...names, ...names].map((name, i) => (
              <span key={i} className={styles.chip} aria-hidden={i >= names.length || undefined}>
                {name}
              </span>
            ))}
          </div>
        ))}
      </section>

      <WithoutWith reduce={reduce} />
      <Steps reduce={reduce} />
      <Hand reduce={reduce} />
      <Achievements reduce={reduce} />
      <Reel reduce={reduce} />
      <Play />
      <Questions />

      <section className={styles.lastCall}>
        <div className={styles.lastCallBox}>
          <span className={styles.eyebrow}>for friend groups, students and game clubs</span>
          <h2 className={styles.h2} style={{ maxWidth: 760 }}>
            your next game night starts a record
          </h2>
          <div className={styles.row} style={{ justifyContent: "center" }}>
            <Link href="/signup" className={`${styles.btn} ${styles.yellow} btn-primary`}>
              Get started
            </Link>
            <Link href="/app" className={`${styles.btn} ${styles.ghost} btn-secondary`}>
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className={`${styles.wrap} ${styles.footer}`}>
        <span className={styles.brand} style={{ fontSize: 14, color: "var(--color-ink)" }}>
          in the game
        </span>
        <Link href="/privacy">privacy policy</Link>
        {contactEmail && (
          <a href={`mailto:${contactEmail}`}>
            <UserText>{contactEmail}</UserText>
          </a>
        )}
        <span className={styles.spacer} />
        <span>© 2026</span>
      </footer>
    </div>
  );
}

// The hero: the cards float and lean toward the cursor, each at its own depth.
function Hero({ reduce }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [roll, setRoll] = useState(1);
  const frame = useRef(0);

  // "in one place" types itself in, its newest letters still shuffling.
  useEffect(() => {
    if (reduce) return undefined;
    const start = performance.now();
    let raf = 0;
    const step = (now) => {
      const k = Math.min(1, (now - start) / 1200);
      setRoll(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const shown = Math.floor(roll * (ROLL_TEXT.length + 3));
  const rollText =
    roll >= 1
      ? ROLL_TEXT
      : ROLL_TEXT.split("")
          .map((ch, i) => (i < shown - 3 ? ch : ch === " " ? " " : i < shown ? LETTERS[(Math.floor(roll * 40) + i * 7) % LETTERS.length] : ""))
          .join("");

  function move(event) {
    if (reduce) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTilt({ x, y }));
  }

  const lean = (k, rest = "") =>
    `perspective(900px) rotateX(${(-tilt.y * k).toFixed(2)}deg) rotateY(${(tilt.x * k).toFixed(2)}deg) translate3d(${(tilt.x * k * 1.4).toFixed(1)}px, ${(tilt.y * k * 1.4).toFixed(1)}px, 0) ${rest}`;

  return (
    <section onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className={`${styles.wrap} ${styles.split} ${styles.hero}`}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow} data-rv="0">
            for board and card game nights
          </span>
          <h1 className={styles.h1} data-rv="1" aria-label="every win you ever had, in one place">
            every win you ever had, <span className={styles.hl}>{rollText}</span>
          </h1>
          <p className={styles.lead} data-rv="2">
            log a game with your friends in under a minute. your history grows into ratings, rivalries and achievements.
          </p>
          <div className={styles.row} data-rv="3">
            <Link href="/signup" className={`${styles.btn} btn-primary`}>
              Get started
            </Link>
            <a href="#how" className={`${styles.btn} btn-secondary`}>
              See how it works
            </a>
          </div>
        </div>

        <div className={styles.heroArt} aria-label="A look at the app">
          <div className={`${styles.ticketWrap} ${styles.float}`}>
            <div className={`${styles.ticket} ${styles.tilt}`} style={{ transform: lean(7, "rotate(-3deg)") }}>
              <span className={styles.ticketPaper} />
              <div className={styles.ticketBody}>
                <div className={styles.ticketTop}>
                  <span>admit one · game night</span>
                  <span>no. 0096</span>
                </div>
                <span className={styles.ticketGame}>catan</span>
                <div className={styles.ticketFacts}>
                  <span>
                    <small>date</small>fri 31 oct
                  </span>
                  <span>
                    <small>players</small>4
                  </span>
                  <span>
                    <small>table</small>
                    <UserText>Friday crew</UserText>
                  </span>
                  <span>
                    <small>result</small>1st
                  </span>
                </div>
                <div className={styles.ticketStub}>
                  <span>rating</span>
                  <strong>+12</strong>
                </div>
              </div>
            </div>
          </div>
          <div className={`${styles.ratingCard} ${styles.float2}`}>
            <div className={`${styles.ratingInner} ${styles.tilt}`} style={{ transform: lean(11) }}>
              <span className={styles.label}>rating</span>
              <span className={styles.big}>
                <span className={styles.hl}>1634</span>
              </span>
              <span className={styles.up}>+42 this month</span>
            </div>
          </div>
          <PersonCard className={styles.float2} style={{ right: 120, bottom: 6, background: "var(--color-turquoise)", rotate: "-7deg", transform: lean(14) }} name="Anna" score="7–5" note="your rival" />
          <PersonCard className={styles.float} style={{ right: 10, bottom: 26, background: "var(--color-pink)", rotate: "6deg", transform: lean(9) }} name="Mark" score="9–3" note="you lead" />
        </div>
      </div>
    </section>
  );
}

function PersonCard({ className, style, name, score, note }) {
  return (
    <div className={`${styles.person} ${styles.tilt} ${className}`} style={style}>
      <span className={styles.av} style={{ background: "#fff" }}>
        <UserText>{name.charAt(0)}</UserText>
      </span>
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 800, fontSize: 17 }}>
          <UserText>{name}</UserText>
        </span>
        <strong>{score}</strong>
        <small>{note}</small>
      </span>
    </div>
  );
}

function Accordion({ items, open, onToggle, className, number }) {
  return items.map(([title, text], i) => {
    const on = open === i;
    return (
      <div key={title} className={`${className} ${on ? styles.open : ""}`}>
        <button type="button" className={styles.acc} aria-expanded={on} onClick={() => onToggle(on ? -1 : i)}>
          <span className={styles.accTitle}>
            {number && <span className={styles.accNo} style={{ color: number }}>{`0${i + 1}`}</span>}
            {title}
          </span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </button>
        <div className={styles.accBody}>
          <div>
            <p>{text}</p>
          </div>
        </div>
      </div>
    );
  });
}

// 01: game nights without a record and with one. Flips by itself until touched.
function WithoutWith({ reduce }) {
  const [mode, setMode] = useState(0);
  const [auto, setAuto] = useState(true);
  const [open, setOpen] = useState(0);
  useEvery(6000, auto && !reduce, () => {
    setMode((m) => 1 - m);
    setOpen(0);
  });

  const bars = Array.from({ length: 24 }, (_, i) => {
    const base = 30 + ((i * 37) % 11) * 6;
    if (mode === 0) {
      const kept = i >= 20;
      return { height: `${kept ? base : 6}%`, background: kept ? "#ff8fc4" : "rgba(255,255,255,.14)", transitionDelay: `${(23 - i) * 25}ms` };
    }
    return { height: `${base + i * 1.2}%`, background: i % 3 === 0 ? "#ffe14d" : "#2fd6d6", transitionDelay: `${i * 25}ms` };
  });

  return (
    <section className={`${styles.section} ${styles.dark}`}>
      <div className={`${styles.wrap} ${styles.stack}`} style={{ gap: 36 }}>
        <div className={styles.head} style={{ gap: 18, maxWidth: "none" }}>
          <span className={styles.eyebrow} style={{ color: "var(--color-pink-soft)" }}>
            <span className={`${styles.idx} ${styles.idxYellow}`}>01 / 07</span>
            {mode ? "the in the game way" : "the problem"}
          </span>
          <div role="tablist" aria-label="Game night" className={styles.toggle}>
            {["without a record", "with in the game"].map((label, i) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={mode === i}
                onClick={() => {
                  setMode(i);
                  setAuto(false);
                  setOpen(0);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.swap}>
            <h2 className={`${styles.h2} ${mode ? styles.hidden : ""}`}>game nights end, and the scores go with them</h2>
            <h2 className={`${styles.h2} ${mode ? "" : styles.hidden}`} aria-hidden={!mode}>
              every game night stays, <span style={{ color: "var(--color-yellow)" }}>and adds up</span>
            </h2>
          </div>
        </div>
        <div className={styles.split} style={{ alignItems: "stretch" }}>
          <div>
            <Accordion
              items={mode ? WITH : WITHOUT}
              open={open}
              onToggle={(i) => {
                setOpen(i);
                setAuto(false);
              }}
              className={styles.darkItem}
              number={mode ? "var(--color-turquoise)" : "var(--color-pink-soft)"}
            />
          </div>
          <div className={styles.stage} style={{ background: "rgba(255,255,255,.06)" }}>
            <div className={styles.row} style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span className={styles.stat} style={{ color: mode ? "var(--color-yellow)" : "#ff8fc4" }}>
                  {mode ? "24 of 24" : "4 of 24"}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
                  {mode ? "game nights saved" : "game nights anyone remembers"}
                </span>
              </span>
              <span className={styles.tag} style={{ background: mode ? "var(--color-turquoise)" : "#ff8fc4" }}>
                {mode ? "all in your history" : "lost by monday"}
              </span>
            </div>
            <div
              className={styles.bars}
              role="img"
              aria-label={mode ? "All 24 weekly game nights kept" : "Only the last 4 of 24 weekly game nights remembered"}
            >
              {bars.map((style, i) => (
                <span key={i} style={style} />
              ))}
            </div>
            <div className={styles.axis}>
              <span>24 weeks ago</span>
              <span>this week</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 02: three steps that advance by themselves; the active one fills its bar.
function Steps({ reduce }) {
  const [step, setStep] = useState(0);
  const [turn, setTurn] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setTimeout(() => setStep((s) => (s + 1) % 3), 7000);
    return () => clearTimeout(id);
  }, [step, turn, reduce]);

  return (
    <section id="how" className={styles.section}>
      <div className={`${styles.wrap} ${styles.stack}`}>
        <div className={styles.head}>
          <span className={styles.eyebrow} data-rv="0">
            <span className={styles.idx}>02 / 07</span>how it works
          </span>
          <h2 className={styles.h2} data-rv="1">
            from the table to your history in three steps
          </h2>
        </div>
        <div className={styles.split} style={{ alignItems: "stretch", gap: 32 }}>
          <div role="tablist" aria-label="Steps" className={styles.tabs}>
            {STEPS.map(([title, text], i) => (
              <button
                key={`${title}-${step === i ? turn : 0}`}
                type="button"
                role="tab"
                aria-selected={step === i}
                className={styles.tab}
                onClick={() => {
                  setStep(i);
                  setTurn((t) => t + 1);
                }}
              >
                <span className={styles.tabBar} aria-hidden="true" />
                <small>step {i + 1}</small>
                <strong>{title}</strong>
                <span className={styles.tabText}>
                  <span>{text}</span>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.stepStage}>
            {step === 0 && <LogDemo />}
            {step === 1 && <GrowDemo reduce={reduce} />}
            {step === 2 && <BoardDemo />}
          </div>
        </div>
      </div>
    </section>
  );
}

function LogDemo() {
  return (
    <div className={`${styles.stage} ${styles.fadein}`} style={{ background: "#fff", boxShadow: "inset 0 0 0 1px #ece4ea" }}>
      <span className={styles.label}>game</span>
      <div className={styles.row}>
        <span className={`${styles.chip} ${styles.pick}`} style={{ "--i": 0 }}>catan</span>
        <span className={styles.chip}>chess</span>
        <span className={styles.chip}>uno</span>
      </div>
      <span className={styles.label}>who played</span>
      <div className={styles.row}>
        <span className={`${styles.chip} ${styles.pick}`} style={{ "--i": 1 }}>you</span>
        <span className={`${styles.chip} ${styles.pick}`} style={{ "--i": 2 }}><UserText>Anna</UserText></span>
        <span className={`${styles.chip} ${styles.pick}`} style={{ "--i": 3 }}><UserText>Mark</UserText></span>
        <span className={styles.chip} style={{ color: "var(--color-muted)" }}>+ guest</span>
      </div>
      <span className={styles.label}>winner</span>
      <div className={styles.row}>
        <span className={`${styles.chip} ${styles.pick}`} style={{ "--i": 4 }}>you</span>
        <span className={styles.chip}><UserText>Anna</UserText></span>
        <span className={styles.chip}><UserText>Mark</UserText></span>
        <span className={styles.saved}>saved · 0:42</span>
      </div>
    </div>
  );
}

// One clock drives the line, the rating number and the season squares.
function GrowDemo({ reduce }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      setT(Math.min(1, ((now - start) % GROW_LOOP) / GROW_MS));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const p = reduce ? 1 : easeOut(t);
  const { reached, games } = seasonAt(SEASON, p);

  return (
    <div className={`${styles.stage} ${styles.fadein}`} style={{ background: "var(--color-ink)", color: "#fff", gap: 20 }}>
      <div className={styles.growHead}>
        <span>rating · catan</span>
        <span className={styles.growRating}>{ratingAt(p)}</span>
      </div>
      <svg viewBox="0 0 600 160" width="100%" height="140" role="img" aria-label="Rating going up over time">
        <path
          d={LINE_PATH}
          pathLength="1"
          fill="none"
          stroke="var(--color-pink)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - p }}
        />
      </svg>
      <div className={styles.season} role="img" aria-label="Game nights over 30 weeks">
        {SEASON.map((level, i) => (
          <span key={i} style={{ background: HEAT[i < reached ? level : 0] }} />
        ))}
      </div>
      <div className={styles.axis}>
        <span>30 weeks ago</span>
        <span>{games} games</span>
      </div>
    </div>
  );
}

function BoardDemo() {
  const rows = [
    ["1", "L", "#ff8fc4", <UserText key="l">Lena</UserText>, "1712", ""],
    ["2", "A", "var(--color-turquoise)", <UserText key="a">Anna</UserText>, "1640", styles.rowA],
    ["3", "Y", "var(--color-yellow)", "you", "1634", styles.rowB],
    ["4", "M", "var(--color-violet-tint)", <UserText key="m">Mark</UserText>, "1590", ""],
  ];
  return (
    <div className={`${styles.stage} ${styles.fadein}`} style={{ background: "var(--color-turquoise-tint)", gap: 8 }}>
      <span style={{ fontWeight: 800, marginBottom: 6 }}>
        leaderboard · <UserText>Friday crew</UserText>
      </span>
      {rows.map(([place, letter, color, name, rating, motion]) => (
        <div key={place} className={`${styles.lrow} ${motion}`}>
          <strong>{place}</strong>
          <span className={styles.av} style={{ background: color }}>
            <UserText>{letter}</UserText>
          </span>
          <span style={{ fontWeight: 800 }}>{name}</span>
          <strong>{rating}</strong>
        </div>
      ))}
    </div>
  );
}

// 03: four cards fanned like a hand; hover or tap one to play it.
function Hand({ reduce }) {
  const [card, setCard] = useState(1);
  const [auto, setAuto] = useState(true);
  useEvery(4500, auto && !reduce, () => setCard((c) => (c + 1) % HAND.length));
  const pick = (i) => {
    setCard(i);
    setAuto(false);
  };
  const pips = [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1];

  return (
    <section className={`${styles.section} ${styles.white}`} style={{ overflow: "hidden" }}>
      <div className={`${styles.wrap} ${styles.stack}`}>
        <div className={styles.split} style={{ alignItems: "flex-end", gap: "24px 56px" }}>
          <div className={styles.head}>
            <span className={styles.eyebrow} data-rv="0">
              <span className={styles.idx}>03 / 07</span>what your history turns into
            </span>
            <h2 className={styles.h2} data-rv="1">
              every game deals you a new card
            </h2>
          </div>
          <p className={styles.lead} data-rv="2">
            your history is a hand you keep building. pick a card to see what it holds.
          </p>
        </div>
        <div className={styles.split} style={{ alignItems: "stretch", gap: 32 }}>
          <div className={styles.stage} style={{ background: "var(--color-bg)", flex: "1 1 440px" }}>
            {card === 0 && (
              <div key="0" className={`${styles.fadein} ${styles.stack}`} style={{ gap: 16 }}>
                <span className={styles.label}>rivals</span>
                <h3 className={styles.h3}>see who you beat, and who keeps beating you</h3>
                <div className={styles.white16}>
                  <span className={styles.av} style={{ background: "var(--color-yellow)" }}>Y</span>
                  <span className={styles.score}>7 – 5</span>
                  <span className={styles.av} style={{ background: "var(--color-turquoise)" }}><UserText>A</UserText></span>
                  <span style={{ marginLeft: "auto", fontWeight: 800 }}>you vs <UserText>Anna</UserText></span>
                </div>
                <div className={styles.row}>
                  {["won", "won", "lost", "won", "lost"].map((r, i) => (
                    <span key={i} className={`${styles.chip} ${r === "won" ? styles.won : ""}`}>{r}</span>
                  ))}
                </div>
              </div>
            )}
            {card === 1 && (
              <div key="1" className={`${styles.fadein} ${styles.stack}`} style={{ gap: 16 }}>
                <span className={styles.label}>streaks</span>
                <h3 className={styles.h3}>3 wins in a row. go for 5.</h3>
                <div className={styles.row} style={{ justifyContent: "space-between", fontWeight: 800 }}>
                  <span>last 20 games</span>
                  <span>13 won</span>
                </div>
                <div className={styles.pips}>
                  {pips.map((won, i) => (
                    <span key={i} style={{ background: won ? "var(--color-ink)" : "#ece4ea" }} />
                  ))}
                </div>
                <div className={styles.row} style={{ justifyContent: "space-between" }}>
                  <span className={styles.label}>win streak</span>
                  <span className={styles.label}>3 of 5 for on fire</span>
                </div>
                <div className={styles.meter}>
                  <span style={{ width: "60%", background: "var(--color-pink-deep)" }} />
                </div>
              </div>
            )}
            {card === 2 && (
              <div key="2" className={`${styles.fadein} ${styles.stack}`} style={{ gap: 16 }}>
                <span className={styles.label}>your games</span>
                <h3 className={styles.h3}>find the game you are secretly great at</h3>
                {[["catan", "68%"], ["yahtzee", "54%"], ["durak", "41%"], ["chess", "33%"]].map(([name, rate]) => (
                  <div key={name} className={styles.gameStat}>
                    <span>{name}</span>
                    <span className={styles.meter} style={{ height: 14 }}>
                      <span style={{ width: rate, background: "var(--color-ink)" }} />
                    </span>
                    <span>{rate}</span>
                  </div>
                ))}
                <span className={styles.label}>win rate per game</span>
              </div>
            )}
            {card === 3 && (
              <div key="3" className={`${styles.fadein} ${styles.stack}`} style={{ gap: 12 }}>
                <span className={styles.label}>your team</span>
                <h3 className={styles.h3}>a feed for your group, so nobody misses a win</h3>
                <div className={styles.white16}>
                  <span className={styles.av} style={{ background: "var(--color-turquoise)" }}><UserText>A</UserText></span>
                  <span style={{ flex: 1 }}><UserText>Anna</UserText> won catan · 4 players</span>
                  <span className={styles.label}>2 h</span>
                </div>
                <div className={styles.white16}>
                  <span className={styles.av} style={{ background: "#ff8fc4" }}><UserText>L</UserText></span>
                  <span style={{ flex: 1 }}><UserText>Lena</UserText> earned giant slayer</span>
                  <span className={styles.label}>yesterday</span>
                </div>
                <div className={styles.white16}>
                  <span className={styles.av} style={{ background: "var(--color-yellow)" }}>Y</span>
                  <span style={{ flex: 1 }}>you won yahtzee online · 284</span>
                  <span className={styles.label}>fri</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.handArea}>
            {HAND.map(([label, big, sub, bg, ink], i) => {
              const on = card === i;
              const off = i - 1.5;
              return (
                <button
                  key={label}
                  type="button"
                  className={styles.pcard}
                  aria-pressed={on}
                  onMouseEnter={() => pick(i)}
                  onFocus={() => pick(i)}
                  onClick={() => pick(i)}
                  style={{
                    "--off": `${off * 22}%`,
                    "--rot": `${on ? 0 : off * 9}deg`,
                    "--y": `${on ? -110 : Math.abs(off) * 14}px`,
                    "--sc": on ? 1.12 : 1,
                    zIndex: on ? 10 : i + 1,
                    background: bg,
                    color: ink,
                  }}
                >
                  <span className={styles.pcardTop}>
                    <span>{label}</span>
                    <span>{`0${i + 1}`}</span>
                  </span>
                  <span className={styles.pcardBig}>{big}</span>
                  <small>{sub}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// 04: a collectible card that switches between three looks, and achievement cards that tilt.
function Achievements({ reduce }) {
  const [look, setLook] = useState(0);
  const [round, setRound] = useState(0);
  const [hover, setHover] = useState({ i: -1, x: 50, y: 50 });
  useEffect(() => {
    if (reduce) return undefined;
    const id = setTimeout(() => setLook((l) => (l + 1) % LOOKS.length), 5000);
    return () => clearTimeout(id);
  }, [look, round, reduce]);

  return (
    <section className={styles.section}>
      <div className={`${styles.wrap} ${styles.stack}`}>
        <div className={styles.split} style={{ alignItems: "flex-end", gap: "24px 56px" }}>
          <div className={styles.head}>
            <span className={styles.eyebrow} data-rv="0">
              <span className={styles.idx}>04 / 07</span>achievements
            </span>
            <h2 className={styles.h2} data-rv="1">
              wins that change how you look
            </h2>
          </div>
          <p className={styles.lead} data-rv="2">
            30 achievements, earned from your own history. some unlock backgrounds and accessories for your character.
          </p>
        </div>
        <div className={styles.achGrid} onMouseLeave={() => setHover({ i: -1, x: 50, y: 50 })}>
          <div className={styles.rare}>
            <div className={styles.rareIn}>
              <div className={styles.rareTop}>
                <div role="group" aria-label="Looks" className={styles.dots}>
                  {LOOKS.map((item, i) => (
                    <button
                      key={item.name}
                      type="button"
                      aria-label={item.name}
                      aria-pressed={look === i}
                      onClick={() => {
                        setLook(i);
                        setRound((r) => r + 1);
                      }}
                    />
                  ))}
                </div>
                <span>{LOOKS[look].name}</span>
              </div>
              <div className={styles.scene}>
                {LOOKS.map((item, i) => (
                  <div key={item.name} className={`${styles.look} ${look === i ? styles.lookOn : ""}`} style={{ background: item.scene }} aria-hidden={look !== i}>
                    <span className={styles.flash} />
                    <div className={styles.figure}>
                      <Character character={item.character} view="full" size="fill" name="" backdrop={false} />
                    </div>
                    <span className={styles.vig} />
                    <div className={styles.toast}>
                      <span className={styles.toastBadge}>unlocked</span>
                      <span className={styles.toastText}>
                        <strong>{item.unlock}</strong>
                        <small>{item.by}</small>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.statBars}>
                {[["wins", 43, 41, "var(--color-pink)"], ["played", 96, 96, "var(--color-turquoise)"], ["streak", 60, 3, "var(--color-yellow)"]].map(([label, width, value, color]) => (
                  <div key={label} className={styles.statBar}>
                    <span>{label}</span>
                    <span>
                      <i style={{ width: `${width}%`, background: color }} />
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {ACHIEVEMENTS.map(([name, rule, tier, have, need], i) => {
            const on = hover.i === i;
            const x = on ? hover.x : 50;
            const y = on ? hover.y : 50;
            return (
              <div
                key={name}
                className={`${styles.ach} ${on ? styles.achOn : ""}`}
                onMouseMove={(event) => {
                  if (reduce) return;
                  const box = event.currentTarget.getBoundingClientRect();
                  setHover({ i, x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 });
                }}
                style={{ transform: `perspective(900px) rotateX(${((50 - y) / 10).toFixed(2)}deg) rotateY(${((x - 50) / 10).toFixed(2)}deg) translateY(${on ? -4 : 0}px)` }}
              >
                <span
                  aria-hidden="true"
                  className={styles.achGlow}
                  style={{ left: `${x}%`, top: `${y}%`, background: `radial-gradient(closest-side, ${GLOWS[i % 3]}, transparent)` }}
                />
                <div className={styles.row} style={{ justifyContent: "space-between" }}>
                  <span className={styles.tier}>
                    {[1, 2, 3].map((k) => (
                      <span key={k} className={k <= tier ? styles.tierOn : ""} />
                    ))}
                  </span>
                  <span className={styles.label}>tier {tier}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3>{name}</h3>
                  <span className={styles.achRule}>{rule}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className={styles.achMeter}>
                    <span style={{ width: `${Math.round((have / need) * 100)}%` }} />
                  </div>
                  <span className={styles.label}>{have >= need ? "earned" : `${have} of ${need}`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// 05: a slot reel spins through the catalog and lands on tonight's game.
function Reel({ reduce }) {
  const [cat, setCat] = useState("all");
  const [idx, setIdx] = useState(pool("all").length + 2);
  const [transition, setTransition] = useState("none");
  const [spinning, setSpinning] = useState(false);
  const [touched, setTouched] = useState(false);
  const timer = useRef(0);
  const games = pool(cat);
  const count = games.length;

  useEffect(() => () => clearTimeout(timer.current), []);

  // Spins for about 4 seconds: each step waits a little longer than the one
  // before, so the reel slows down, and the waits add up to SPIN_MS.
  function spin() {
    if (spinning) return;
    const base = (idx % count) + count;
    const steps = reduce ? 1 : 16 + Math.floor(Math.random() * count);
    const weights = Array.from({ length: steps }, (_, k) => 1 + Math.pow((k + 1) / steps, 2) * 12);
    const total = weights.reduce((sum, w) => sum + w, 0);
    const delays = weights.map((w) => (reduce ? 0 : Math.round((w / total) * (SPIN_MS - 100))));
    setIdx(base);
    setTransition("none");
    setSpinning(true);
    let k = 0;
    const tick = () => {
      const delay = delays[k];
      k += 1;
      setTransition(delay ? `transform ${delay}ms cubic-bezier(.3,.7,.4,1)` : "none");
      setIdx((value) => value + 1);
      timer.current = k < steps ? setTimeout(tick, delay) : setTimeout(() => setSpinning(false), delay);
    };
    timer.current = setTimeout(tick, 30);
  }

  // Spins by itself every few seconds until someone touches it.
  useEvery(9000, !touched && !reduce, spin);

  const current = games[((idx % count) + count) % count];

  return (
    <section id="games" className={`${styles.section} ${styles.white}`}>
      <div className={`${styles.wrap} ${styles.split}`}>
        <div className={styles.head} style={{ gap: 18 }}>
          <span className={styles.eyebrow} data-rv="0">
            <span className={styles.idx}>05 / 07</span>games
          </span>
          <h2 className={styles.h2} data-rv="1">
            can&apos;t pick a game? spin for one
          </h2>
          <p className={styles.lead} data-rv="2">
            30+ games, from chess to card games you play without a box. missing one? add your own, and your teams can log it too.
          </p>
          <div role="group" aria-label="Game type" className={styles.row}>
            {["all", "dice", "cards", "strategy", "party"].map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={cat === type}
                className={`${styles.chip} ${cat === type ? styles.catOn : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (spinning) return;
                  setTouched(true);
                  setCat(type);
                  setIdx(pool(type).length + 2);
                  setTransition("none");
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.machine}>
          <div className={styles.machineHead}>
            <span>tonight&apos;s game</span>
            <small>{cat === "all" ? `${count} shown · 30+ in the app` : `${count} ${cat} games`}</small>
          </div>
          <div className={styles.window}>
            <span className={styles.windowBand} aria-hidden="true" />
            <div className={styles.reel} aria-live="polite" style={{ transform: `translateY(${-(idx - 1) * REEL_ROW}px)`, transition }}>
              {Array.from({ length: count * REEL_REPEAT }, (_, i) => (
                <div key={i} className={i === idx ? styles.current : ""} aria-hidden={i !== idx}>
                  {games[i % count][0]}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.machineFoot}>
            {!spinning && (
              <span key={idx} className={styles.pop}>
                <span className={styles.chip} style={{ background: TYPE_BG[current[1]], boxShadow: "none" }}>
                  {current[1]}
                </span>
                log it in under a minute
              </span>
            )}
            <span className={styles.spacer} />
            <button
              type="button"
              className={`${styles.btn} ${styles.yellow} ${styles.spin} btn-primary`}
              onClick={() => {
                setTouched(true);
                spin();
              }}
            >
              {spinning ? "spinning…" : "spin"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 06: dice and a live online game log that types itself.
function Play() {
  const [lines, setLines] = useState(0);
  useEvery(1100, true, () => setLines((n) => (n + 1) % (FEED.length + 4)));

  return (
    <section id="play" className={`${styles.section} ${styles.play}`}>
      <div className={`${styles.wrap} ${styles.split}`}>
        <div className={styles.head} style={{ gap: 18 }}>
          <span className={styles.eyebrow} style={{ color: "var(--color-pink-soft)" }}>
            <span className={`${styles.idx} ${styles.idxYellow}`}>06 / 07</span>play in the app
          </span>
          <h2 className={styles.h2}>no dice? no cards? play right here</h2>
          <p className={styles.lead} style={{ color: "rgba(255,255,255,.75)" }}>
            yahtzee and blackjack, alone or on one phone. invite your team to online yahtzee and play from your own phones. finished online games go
            straight into your history.
          </p>
          <div>
            <Link href="/signup" className={`${styles.btn} ${styles.yellow} btn-primary`}>
              Play now
            </Link>
          </div>
        </div>
        <div className={styles.stack} style={{ gap: 22 }}>
          <div className={styles.dice} aria-hidden="true">
            {[-8, 5, -3, 9, -6].map((tilt, i) => (
              <div key={i} className={styles.die} style={{ "--i": i, "--r": `${tilt}deg` }}>
                {[1, 0, 1, 1, 0, 1, 1, 0, 1].map((pip, k) => (
                  <span key={k} style={{ opacity: pip }} />
                ))}
              </div>
            ))}
          </div>
          <div className={styles.log} aria-label="Live game log">
            <div className={styles.logHead}>
              <span>
                online yahtzee · <UserText>Friday crew</UserText>
              </span>
              <span style={{ color: "var(--color-turquoise)" }}>live</span>
            </div>
            <div className={styles.logBody}>
              {FEED.slice(0, Math.min(lines, FEED.length)).map(([at, text, color]) => (
                <div key={text} className={`${styles.logLine} ${styles.fadein}`}>
                  <small>{at}</small>
                  <span style={{ color }}>{text}</span>
                </div>
              ))}
              <span className={styles.cursor} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 07: questions.
function Questions() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className={styles.section}>
      <div className={`${styles.wrap} ${styles.split}`} style={{ alignItems: "flex-start" }}>
        <div className={styles.faqHead}>
          <span className={styles.eyebrow} data-rv="0">
            <span className={styles.idx}>07 / 07</span>questions
          </span>
          <h2 className={styles.h2} data-rv="1">
            before your first game
          </h2>
        </div>
        <div style={{ flex: "1.6 1 480px" }}>
          <Accordion items={FAQ} open={open} onToggle={setOpen} className={styles.faqItem} />
        </div>
      </div>
    </section>
  );
}
