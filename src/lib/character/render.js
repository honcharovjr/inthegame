// What to draw for a character, as plain data: the image layers from back to
// front, with their tint and placement, and the irises. Pure, so it can be
// tested and drawn by any renderer (the Character component draws it as SVG).
//
// Coordinates are pixels of the full art canvas (art.json: 1024 x 1536),
// written by scripts/build_character_web.py. Every layer covers the whole
// canvas; hair and beards are drawn for the human and moved onto the head of
// the chosen race.

import art from "./art.json";
import {
  BEARDS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIRSTYLES,
  SKINS,
  resolveCharacter,
} from "./items";

// The grey that hair is stored in, around its middle. A tint is scaled by it,
// so the hair shows the chosen colour rather than a darker one.
const HAIR_GREY = 185;

export const CANVAS = { width: art.width, height: art.height };

const href = (name) => `/character/${name}.webp`;
const hex = (list, code) => list.find((item) => item.code === code).hex;

// "#rrggbb" to how much each colour channel is multiplied by.
export function tintFactors(color, grey) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round((c / grey) * 1000) / 1000);
}

// The SVG transform that moves a part drawn for the human onto a race.
export function fitTransform(fit, kind) {
  const { sx, sy } = fit[kind];
  const [fx, fy] = fit.from;
  const [tx, ty] = fit.to;
  return `translate(${tx} ${ty}) scale(${sx} ${sy}) translate(${-fx} ${-fy})`;
}

// The visible part of the canvas: "portrait" is a square around the head,
// "full" the whole figure down to the waist.
export function viewBox(race, view) {
  const box = view === "full" ? art.full : art.races[race].portrait;
  return { x: box.x, y: box.y, w: box.w, h: box.h };
}

export function characterScene(raw, view = "portrait") {
  const c = resolveCharacter(raw);
  const race = art.races[c.race];
  const skin = tintFactors(hex(SKINS, c.skin), race.skinGrey);
  const hairTint = tintFactors(hex(HAIR_COLORS, c.hairColor), HAIR_GREY);
  const hair = HAIRSTYLES.find((item) => item.code === c.hair).layer;
  const beard = BEARDS.find((item) => item.code === c.beard).layer;

  const layers = [{ key: "body", href: href(c.race), tint: skin }];
  layers.push({ key: "eyes", href: href(`eyes-${c.race}`) });
  if (beard) {
    layers.push({ key: "beard", href: href(beard), tint: hairTint, transform: fitTransform(race.fit, "beard") });
  }
  if (hair) {
    layers.push({ key: "hair", href: href(hair), tint: hairTint, transform: fitTransform(race.fit, "hair") });
  }
  // Horns grow through the hair, so they are drawn again on top of it.
  if (race.horns && hair) {
    layers.push({ key: "horns", href: href(`horns-${c.race}`), tint: skin });
  }

  const eyeColor = hex(EYE_COLORS, c.eyeColor);
  const irises = race.eyes.map((eye) => ({
    cx: eye.cx,
    cy: eye.cy,
    r: Math.round(eye.ry * 1.25 * 10) / 10,
    color: eyeColor,
  }));

  return { box: viewBox(c.race, view), layers, irises, eyesHref: href(`eyes-${c.race}`) };
}
