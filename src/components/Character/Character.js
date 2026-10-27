import { useId } from "react";
import { findAchievement } from "@/lib/achievements/catalog";
import { findAccessory, findBackground, resolveCharacter } from "@/lib/character/items";
import { CANVAS, characterScene } from "@/lib/character/render";
import styles from "./Character.module.css";

const INK = "#120a1a";

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

// One layer of the art, tinted by multiplying its grey with a colour.
function Tint({ id, factors }) {
  const [r, g, b] = factors;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`} />
    </filter>
  );
}

// The figure itself, in canvas pixels, seen through the box of the view.
function Figure({ scene, uid, height, fade }) {
  const { box, layers, irises, eyesHref } = scene;
  const image = { width: CANVAS.width, height: CANVAS.height, preserveAspectRatio: "none" };
  const fadeId = `fade-${uid}`;
  return (
    <svg x="0" y="0" width="100" height={height} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}>
      <defs>
        {layers.map((layer) =>
          layer.tint ? <Tint key={layer.key} id={`${layer.key}-${uid}`} factors={layer.tint} /> : null,
        )}
        <mask id={`iris-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={CANVAS.width} height={CANVAS.height}>
          <image href={eyesHref} {...image} />
        </mask>
        {fade && (
          <linearGradient id={`${fadeId}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.86" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
        )}
        {fade && (
          <mask id={fadeId} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={`url(#${fadeId}-g)`} />
          </mask>
        )}
      </defs>
      <g className={styles.figure} mask={fade ? `url(#${fadeId})` : undefined}>
        {layers.map((layer) => (
          <g key={layer.key}>
            <image
              href={layer.href}
              {...image}
              filter={layer.tint ? `url(#${layer.key}-${uid})` : undefined}
              transform={layer.transform}
            />
            {layer.key === "eyes" && (
              <g mask={`url(#iris-${uid})`}>
                {irises.map((iris) => (
                  <g key={iris.cx}>
                    <circle cx={iris.cx} cy={iris.cy} r={iris.r} fill={iris.color} stroke="rgba(0,0,0,0.35)" strokeWidth={iris.r * 0.18} />
                    <circle cx={iris.cx} cy={iris.cy} r={iris.r * 0.42} fill="#1a1216" />
                    <circle cx={iris.cx - iris.r * 0.3} cy={iris.cy - iris.r * 0.3} r={iris.r * 0.18} fill="#fff" opacity="0.8" />
                  </g>
                ))}
              </g>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

// The character of a player, drawn from layered art as an SVG. character is
// the saved choice (or null). Without one, a disc in the given colour wears
// the first letter of the name.
// view: "portrait" (a round avatar around the head) or "full" (the whole
// figure down to the waist, in a rounded card; size is then its width).
// perks: show the animated perks of the accessory. Use it where the character
// is large. The gold ring of the laurel wreath always shows.
export default function Character({
  character,
  name = "",
  size = 44,
  color = "#ff4fa3",
  perks = false,
  view = "portrait",
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const chosen = Boolean(character);
  const parts = resolveCharacter(character);
  const background = findBackground(parts.background);
  const accessory = findAccessory(parts.accessory);
  const perk = accessory?.perk;
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const full = view === "full";

  const patternId = `bg-${uid}`;
  const clipId = `clip-${uid}`;
  const showPerks = perks && perk;
  const scene = chosen ? characterScene(character, view) : null;
  // The outer drawing is 100 wide; a full view is as tall as its box.
  const height = full && scene ? Math.round((100 * scene.box.h) / scene.box.w) : 100;

  const classes = [
    styles.wrap,
    full && styles.full,
    perk === "ring" && !full && styles.ring,
    showPerks && styles[`perk_${perk}`],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{ width: size, height: (size * height) / 100 }}
      role="img"
      aria-label={name ? `${name}'s character` : "Character"}
    >
      <svg viewBox={`0 0 100 ${height}`} width={size} height={(size * height) / 100} className={styles.svg}>
        <defs>
          <clipPath id={clipId}>
            {full ? <rect width="100" height={height} rx="8" /> : <circle cx="50" cy="50" r="50" />}
          </clipPath>
          {background.kind !== "plain" && <Pattern id={patternId} background={background} />}
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect width="100" height={height} fill={background.fill} />
          {background.kind !== "plain" && (
            <rect width="100" height={height} fill={`url(#${patternId})`} />
          )}
          {scene ? (
            <Figure scene={scene} uid={uid} height={height} fade={full} />
          ) : (
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fontSize="44"
              fontWeight="800"
              fill={INK}
              fontFamily="inherit"
            >
              {letter}
            </text>
          )}
          {chosen && parts.badge && !full && <Badge code={parts.badge} />}
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
