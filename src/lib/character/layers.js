// Fits the layered character parts onto a body. Pure functions, no browser
// code, so they can be tested and used by any renderer.
//
// Every part image was drawn once, for the human male. A body has landmarks
// (anchors.json, written by scripts/cut_character_sheets.py). The fit turns
// "this part on that body" into a rectangle in the body's own pixels.
//
// Coordinates are pixels of the cut body image: x to the right, y down, the
// top of the head at y = 0.

// From the back to the front.
export const SLOT_ORDER = ["body", "outfit", "held", "beard", "hair", "headwear"];

// How each part sits on the head. k: the part's image width as a multiple of
// the skull width. ax, ay: the point of the part image that is placed on the
// head (0 to 1 across and down the image). hx, hy: where on the head that
// point goes (hx across, from the centre, in skull widths; hy down from the
// top of the head, in head heights).
export const HEAD_FIT = {
  "hair-short": { k: 1.32, ax: 0.5, ay: 0.0, hx: 0, hy: -0.05 },
  "hair-long": { k: 1.5, ax: 0.5, ay: 0.0, hx: 0, hy: -0.05 },
  "hair-ponytail": { k: 1.5, ax: 0.5, ay: 0.0, hx: 0, hy: -0.07 },
  "hair-mohawk": { k: 1.12, ax: 0.5, ay: 0.12, hx: 0, hy: 0.0 },
  "hair-braids": { k: 1.5, ax: 0.5, ay: 0.0, hx: 0, hy: -0.05 },
  // Beards are sized from the face width: the mean of skull and jaw.
  "beard-stubble": { k: 1.3, ax: 0.5, ay: 0.0, hx: 0, hy: 0.52 },
  "beard-full": { k: 1.5, ax: 0.5, ay: 0.0, hx: 0, hy: 0.55 },
  "beard-braided": { k: 1.5, ax: 0.5, ay: 0.0, hx: 0, hy: 0.55 },
  "beard-goatee": { k: 1.45, ax: 0.5, ay: 0.0, hx: 0, hy: 0.58 },
  "beard-moustache": { k: 1.3, ax: 0.5, ay: 0.5, hx: 0, hy: 0.72 },
  "headwear-wizard-hat": { k: 2.3, ax: 0.5, ay: 0.9, hx: 0, hy: 0.3 },
  "headwear-viking-helm": { k: 2.0, ax: 0.5, ay: 0.85, hx: 0, hy: 0.42 },
  "headwear-hood": { k: 2.0, ax: 0.5, ay: 0.82, hx: 0, hy: 0.95 },
  "headwear-crown": { k: 1.45, ax: 0.5, ay: 0.85, hx: 0, hy: 0.14 },
  "headwear-knight-helm": { k: 2.4, ax: 0.5, ay: 0.85, hx: 0, hy: 0.55 },
};

// Garments are drawn for the human male: where the neck of the garment is,
// as a fraction down the image.
export const OUTFIT_NECK = {
  "outfit-tunic": 0.03,
  "outfit-robe": 0.05,
  "outfit-plate": 0.04,
  "outfit-leather": 0.04,
  "outfit-cloak": 0.16,
};

// Items held in a hand. size: the part's height as a fraction of the body
// height. ax, ay: the point of the part that sits in the hand. side: which
// hand. dy: the hand's height, as a fraction of the body height.
export const HELD_FIT = {
  "held-staff": { size: 0.88, ax: 0.5, ay: 0.6, side: "right", dy: 0.5 },
  "held-sword": { size: 0.36, ax: 0.5, ay: 0.16, side: "right", dy: 0.5 },
  "held-shield": { size: 0.27, ax: 0.5, ay: 0.5, side: "left", dy: 0.5 },
  "held-spellbook": { size: 0.19, ax: 0.5, ay: 0.5, side: "left", dy: 0.52 },
  "held-lantern": { size: 0.17, ax: 0.5, ay: 0.06, side: "right", dy: 0.52 },
};

const HUMAN = "human-male";

// Broad races have arms that stick out past a human's sleeves, so their
// garments are drawn a little wider.
export const GEAR_WIDTH = { "human-male": 1.03, "human-female": 1, elf: 1, dwarf: 1.13, orc: 1.07 };

// With an outfit on, the body below the hands is not drawn: trousers and
// boots replace the bare legs and feet, and no skin peeks out between them.
// This is the share of the body's height that is still drawn, from the top.
export const BODY_CLIP_WITH_OUTFIT = 0.56;

// The scale that fits a garment to the human male: from the neck to the feet.
function outfitScale(anchors, partKey, partH) {
  const human = anchors[HUMAN];
  const neckTop = human.chinY + 0.012 * human.height;
  return (human.bottom - neckTop) / (partH * (1 - OUTFIT_NECK[partKey]));
}

// part: { key, w, h } (key like "hair-short", w and h in image pixels)
// anchors: all bodies' landmarks. bodyKey: the body to fit on.
// tweak: optional { dx, dy, scale }, a nudge by the player's designer, with
// dx and dy as fractions of the body height.
// Returns { x, y, w, h } in body pixels.
export function fitPart(part, anchors, bodyKey, tweak = {}) {
  const body = anchors[bodyKey];
  const kind = part.key.split("-")[0];
  const headH = body.chinY - body.top;
  const cx = body.headCenterX;
  const nudge = { dx: tweak.dx ?? 0, dy: tweak.dy ?? 0, scale: tweak.scale ?? 1 };
  let rect;

  if (kind === "outfit") {
    const human = anchors[HUMAN];
    const s = outfitScale(anchors, part.key, part.h);
    const neck = OUTFIT_NECK[part.key];
    const neckTop = body.chinY + 0.012 * body.height;
    const sy = (s * (body.bottom - neckTop)) / (human.bottom - (human.chinY + 0.012 * human.height));
    const sx =
      ((s * (body.shoulderRight - body.shoulderLeft)) / (human.shoulderRight - human.shoulderLeft)) *
      (GEAR_WIDTH[bodyKey] ?? 1);
    const w = part.w * sx;
    const h = part.h * sy;
    rect = { x: cx - w / 2, y: neckTop - neck * h, w, h };
  } else if (kind === "held") {
    const fit = HELD_FIT[part.key];
    const h = fit.size * body.height;
    const w = (part.w / part.h) * h;
    const sw = body.shoulderRight - body.shoulderLeft;
    const handX = fit.side === "right" ? body.shoulderRight + 0.05 * sw : body.shoulderLeft - 0.05 * sw;
    const handY = body.top + fit.dy * body.height;
    rect = { x: handX - fit.ax * w, y: handY - fit.ay * h, w, h };
  } else if (kind === "body") {
    rect = { x: 0, y: 0, w: body.width, h: body.height };
  } else {
    const fit = HEAD_FIT[part.key];
    const basis = kind === "beard" ? (body.headWidth + body.jawWidth) / 2 : body.headWidth;
    const w = fit.k * basis;
    const h = (part.h / part.w) * w;
    const px = cx + fit.hx * basis;
    const py = body.top + fit.hy * headH;
    rect = { x: px - fit.ax * w, y: py - fit.ay * h, w, h };
  }

  // The nudge scales around the part's own centre, then moves it.
  const cxr = rect.x + rect.w / 2;
  const cyr = rect.y + rect.h / 2;
  const w = rect.w * nudge.scale;
  const h = rect.h * nudge.scale;
  return {
    x: cxr - w / 2 + nudge.dx * body.height,
    y: cyr - h / 2 + nudge.dy * body.height,
    w,
    h,
  };
}

// The portrait: a square around the head, in body pixels.
export function portraitBox(anchors, bodyKey) {
  const body = anchors[bodyKey];
  const headH = body.chinY - body.top;
  const size = headH * 3.1;
  return { x: body.headCenterX - size / 2, y: body.top - headH * 0.55, w: size, h: size };
}

// The whole figure with room for hats, capes and held items.
export function figureBox(anchors, bodyKey) {
  const body = anchors[bodyKey];
  const padX = body.width * 0.4;
  return { x: -padX, y: -body.height * 0.13, w: body.width + padX * 2, h: body.height * 1.15 };
}
