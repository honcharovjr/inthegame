import { useId } from "react";
import { findAchievement } from "@/lib/achievements/catalog";
import {
  findAccessory,
  findBackground,
  findColor,
  resolveCharacter,
} from "@/lib/character/items";
import styles from "./Character.module.css";

const INK = "#120a1a";

const BODY_SHAPES = {
  round: <circle cx="50" cy="57" r="28" />,
  squircle: <rect x="22" y="29" width="56" height="56" rx="22" />,
  tall: <ellipse cx="50" cy="56" rx="23" ry="31" />,
  wobbly: (
    <path d="M50 27c14 0 28 8 29 24 1 14-6 30-22 33-16 3-36-6-37-23-1-17 14-34 30-34z" />
  ),
  droplet: (
    <path d="M50 22C58 36 78 46 78 62a28 28 0 0 1-56 0C22 46 42 36 50 22z" />
  ),
};

function Eyes({ kind }) {
  const stroke = { fill: "none", stroke: INK, strokeWidth: 3, strokeLinecap: "round" };
  switch (kind) {
    case "wide":
      return (
        <g>
          <ellipse cx="40" cy="52" rx="6.5" ry="7.5" fill="#fff" />
          <ellipse cx="60" cy="52" rx="6.5" ry="7.5" fill="#fff" />
          <circle cx="41" cy="53" r="3.2" fill={INK} />
          <circle cx="59" cy="53" r="3.2" fill={INK} />
        </g>
      );
    case "sleepy":
      return (
        <g {...stroke}>
          <path d="M34 52q6 5 12 0" />
          <path d="M54 52q6 5 12 0" />
        </g>
      );
    case "happy":
      return (
        <g {...stroke}>
          <path d="M34 54q6-7 12 0" />
          <path d="M54 54q6-7 12 0" />
        </g>
      );
    case "wink":
      return (
        <g>
          <circle cx="40" cy="52" r="3.6" fill={INK} />
          <path d="M54 54q6-7 12 0" {...stroke} />
        </g>
      );
    default:
      return (
        <g fill={INK}>
          <circle cx="40" cy="52" r="3.6" />
          <circle cx="60" cy="52" r="3.6" />
        </g>
      );
  }
}

function Mouth({ kind }) {
  const stroke = { fill: "none", stroke: INK, strokeWidth: 3, strokeLinecap: "round" };
  switch (kind) {
    case "grin":
      return <path d="M39 63h22a11 10 0 0 1-22 0z" fill={INK} />;
    case "flat":
      return <path d="M43 68h14" {...stroke} />;
    case "open":
      return <ellipse cx="50" cy="68" rx="5.5" ry="6.5" fill={INK} />;
    case "tongue":
      return (
        <g>
          <path d="M41 64q9 9 18 0" {...stroke} />
          <path d="M46 68.5q4 8 8 0z" fill="#ff4f6d" stroke={INK} strokeWidth="1.5" />
        </g>
      );
    default:
      return <path d="M41 64q9 9 18 0" {...stroke} />;
  }
}

function Pattern({ id, background }) {
  const { kind, ink } = background;
  const common = { id, patternUnits: "userSpaceOnUse" };
  switch (kind) {
    case "dots":
      return (
        <pattern {...common} width="14" height="14">
          <circle cx="4" cy="4" r="2.4" fill={ink} />
          <circle cx="11" cy="11" r="2.4" fill={ink} />
        </pattern>
      );
    case "stripes":
      return (
        <pattern {...common} width="12" height="12" patternTransform="rotate(35)">
          <rect width="6" height="12" fill={ink} />
        </pattern>
      );
    case "rings":
      return (
        <pattern {...common} width="20" height="20">
          <circle cx="10" cy="10" r="6" fill="none" stroke={ink} strokeWidth="2.4" />
        </pattern>
      );
    case "confetti":
      return (
        <pattern {...common} width="24" height="24">
          <rect x="3" y="4" width="6" height="2.6" rx="1" fill={ink} transform="rotate(30 6 5)" />
          <circle cx="17" cy="9" r="2" fill="#ff4fa3" />
          <rect x="12" y="17" width="6" height="2.6" rx="1" fill="#2fd6d6" transform="rotate(-40 15 18)" />
        </pattern>
      );
    case "zigzag":
      return (
        <pattern {...common} width="20" height="14">
          <path d="M0 10l5-6 5 6 5-6 5 6" fill="none" stroke={ink} strokeWidth="2.4" />
        </pattern>
      );
    case "stars":
      return (
        <pattern {...common} width="22" height="22">
          <path d="M6 3l1.3 2.7 3 .4-2.2 2.1.5 3L6 9.7 3.4 11.2l.5-3L1.7 6.1l3-.4z" fill={ink} />
          <circle cx="16" cy="15" r="1.2" fill="#fff" />
        </pattern>
      );
    case "checker":
      return (
        <pattern {...common} width="20" height="20">
          <rect width="10" height="10" fill={ink} />
          <rect x="10" y="10" width="10" height="10" fill={ink} />
        </pattern>
      );
    default:
      return null;
  }
}

// Things drawn behind the body or in front of it. They sit in a 100 x 100 box.
function Behind({ accessory }) {
  if (accessory === "cape") {
    return <path d="M30 62L16 95h68L70 62z" fill="#8f7bff" />;
  }
  return null;
}

function Front({ accessory, shineId }) {
  const gold = "#ffc928";
  switch (accessory) {
    case "party-hat":
      return (
        <g>
          <path d="M50 6L36 33h28z" fill="#d6247a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="45" cy="22" r="2" fill="#ffe14d" />
          <circle cx="54" cy="27" r="2" fill="#2fd6d6" />
          <circle cx="50" cy="6" r="4" fill="#ffe14d" stroke={INK} strokeWidth="1.5" />
        </g>
      );
    case "round-glasses":
      return (
        <g fill="none" stroke={INK} strokeWidth="2.6">
          <circle cx="40" cy="52" r="9" fill="rgba(255,255,255,0.25)" />
          <circle cx="60" cy="52" r="9" fill="rgba(255,255,255,0.25)" />
          <path d="M49 52h2" />
          <g clipPath={`url(#${shineId})`} stroke="none">
            <rect className={styles.shineBar} x="-20" y="40" width="7" height="26" fill="#fff" opacity="0.8" transform="rotate(20 40 52)" />
          </g>
        </g>
      );
    case "bow-tie":
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
          <path d="M50 83l-11-7v14z" fill="#d6247a" />
          <path d="M50 83l11-7v14z" fill="#d6247a" />
          <circle cx="50" cy="83" r="3.2" fill="#b0145f" />
        </g>
      );
    case "headband":
      return (
        <g>
          <path d="M26 40q24-17 48 0" fill="none" stroke="#2fd6d6" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 27l2 4.2 4.6.6-3.4 3.2.9 4.5L50 37.2l-4.1 2.3.9-4.5-3.4-3.2 4.6-.6z" fill="#ffe14d" stroke={INK} strokeWidth="1.2" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M24 56q0-30 26-30t26 30" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <rect x="19" y="50" width="11" height="19" rx="5" fill="#ff4fa3" stroke={INK} strokeWidth="2" />
          <rect x="70" y="50" width="11" height="19" rx="5" fill="#ff4fa3" stroke={INK} strokeWidth="2" />
        </g>
      );
    case "laurel-wreath":
      return (
        <g fill="#5fb85f" stroke="#2f7a2f" strokeWidth="1">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx={24 + i * 1.5} cy={78 - i * 11} rx="6.5" ry="3.2" transform={`rotate(${-50 - i * 8} ${24 + i * 1.5} ${78 - i * 11})`} />
              <ellipse cx={76 - i * 1.5} cy={78 - i * 11} rx="6.5" ry="3.2" transform={`rotate(${50 + i * 8} ${76 - i * 1.5} ${78 - i * 11})`} />
            </g>
          ))}
        </g>
      );
    case "captain-hat":
      return (
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <path d="M28 38q22-18 44 0v5H28z" fill="#f6f1ff" />
          <path d="M26 43h48q-3 6-24 6t-24-6z" fill={INK} />
          <circle cx="50" cy="33" r="4" fill={gold} />
        </g>
      );
    case "star-crown":
      return (
        <path d="M32 33l4-17 8 9 6-12 6 12 8-9 4 17z" fill={gold} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      );
    case "monocle":
      return (
        <g fill="none" stroke={gold} strokeWidth="2.6">
          <circle cx="60" cy="52" r="9" fill="rgba(255,255,255,0.25)" />
          <path d="M68 58q8 12 0 24" strokeWidth="1.6" />
        </g>
      );
    default:
      return null;
  }
}

const BADGE_COLORS = { 1: "#c98b4a", 2: "#c3ccd6", 3: "#ffc928" };

function Badge({ code }) {
  const tier = findAchievement(code)?.tier;
  if (!tier) return null;
  return (
    <g>
      <circle cx="79" cy="79" r="12" fill={BADGE_COLORS[tier]} stroke="#fff" strokeWidth="2.5" />
      <path d="M79 71l2.7 5.6 6 .8-4.4 4.2 1.1 6L79 84.7l-5.4 2.9 1.1-6-4.4-4.2 6-.8z" fill="#fff" />
    </g>
  );
}

// The flat blob creature of a player. Drawn as an SVG, so it is sharp at any
// size. character is the saved choice (or null). Without one, the blob wears
// the first letter of the name in the given colour.
// perks: show the animated perks of the accessory. Use it where the character
// is large. The gold ring of the laurel wreath always shows.
export default function Character({
  character,
  name = "",
  size = 44,
  color = "#ff4fa3",
  perks = false,
}) {
  const uid = useId().replace(/:/g, "");
  const chosen = Boolean(character);
  const parts = resolveCharacter(character);
  const body = chosen ? (findColor(parts.color)?.hex ?? color) : color;
  const background = findBackground(parts.background);
  const accessory = findAccessory(parts.accessory);
  const perk = accessory?.perk;
  const letter = name.trim().charAt(0).toUpperCase() || "?";

  const patternId = `bg-${uid}`;
  const clipId = `clip-${uid}`;
  const shineId = `shine-${uid}`;
  const showPerks = perks && perk;

  const classes = [
    styles.wrap,
    perk === "ring" && styles.ring,
    showPerks && styles[`perk_${perk}`],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{ width: size, height: size }}
      role="img"
      aria-label={name ? `${name}'s character` : "Character"}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className={styles.svg}>
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="50" />
          </clipPath>
          {background.kind !== "plain" && <Pattern id={patternId} background={background} />}
          <clipPath id={shineId}>
            <circle cx="40" cy="52" r="9" />
            <circle cx="60" cy="52" r="9" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect width="100" height="100" fill={background.fill} />
          {background.kind !== "plain" && (
            <rect width="100" height="100" fill={`url(#${patternId})`} />
          )}
          <g className={styles.figure}>
            <Behind accessory={parts.accessory} />
            <g fill={body} stroke={INK} strokeWidth="2.4" strokeLinejoin="round">
              {BODY_SHAPES[parts.body]}
            </g>
            {chosen ? (
              <>
                <Eyes kind={parts.eyes} />
                <Mouth kind={parts.mouth} />
              </>
            ) : (
              <text
                x="50"
                y="68"
                textAnchor="middle"
                fontSize="34"
                fontWeight="800"
                fill={INK}
                fontFamily="inherit"
              >
                {letter}
              </text>
            )}
            <Front accessory={parts.accessory} shineId={shineId} />
          </g>
          {chosen && parts.badge && <Badge code={parts.badge} />}
        </g>
      </svg>

      {showPerks && perk === "confetti" && (
        <span className={styles.confetti} aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ "--a": `${i * 36}deg`, "--c": ["#ff4fa3", "#2fd6d6", "#ffe14d", "#8f7bff"][i % 4] }} />
          ))}
        </span>
      )}
      {showPerks && perk === "sparkle" && (
        <span className={styles.sparkles} aria-hidden="true">
          <i style={{ left: "4%", top: "14%" }} />
          <i style={{ right: "2%", top: "34%", animationDelay: "0.6s" }} />
          <i style={{ left: "16%", bottom: "6%", animationDelay: "1.2s" }} />
        </span>
      )}
      {showPerks && perk === "swoosh" && <span className={styles.swoosh} aria-hidden="true" />}
    </span>
  );
}
