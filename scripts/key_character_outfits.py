"""Cuts the dressed figures and fits every outfit to every race.

Input:
- art/character-outfits/outfit-basic-{race}.png: each race dressed by the AI,
  clothes in pure blue, on flat magenta. These are the races' figures: the
  skin, and the body shape every outfit is fitted to
- art/character-outfits/human/outfit-{name}.png: the human figure in each
  outfit, cloth in pure blue and trim (metal, leather, fur) in pure green

Output, in art/character-outfits/cut/:
- {race}.png: the skin, grey, to be tinted. It also fills the area under the
  clothes, so no gap shows at their edges
- hands-{race}.png: the bare hands alone, drawn over the clothes
- outfit-{name}-{race}-cloth.png and -trim.png: the outfit, grey, fitted to
  the race. Cloth takes the player's colour, trim a fixed colour per outfit
- anchors.json: where the head and eyes are, for fitting hair
- art/character-outfits/preview.png: every outfit on every race

The outfits are drawn once, on the human, and moved onto each race row by
row: each row of the race's figure is matched to a row of the human's, and
within a row the arms and the torso are stretched to the race's own.

Run with pillow, numpy and scipy:
    python3 scripts/key_character_outfits.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "character-outfits"
OUT = SRC / "cut"

RACES = ["human", "elf", "dwarf", "orc", "tiefling"]
OUTFITS = ["tunic", "leather", "chainmail", "plate", "robe", "ranger", "doublet", "fur", "coat", "cleric"]
W, H = 1024, 1536

MAGENTA = np.array([255.0, 0.0, 255.0])
# The grey range the clothes are stored in, as for hair.
GREY_DARK, GREY_LIGHT = 60.0, 235.0


def key_magenta(rgb):
    """The figure against the magenta: (alpha, colour without the magenta)."""
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.clip(np.minimum(r, b) - g, 0, 255) / 255.0
    alpha = np.clip(1.0 - m, 0, 1)
    clean = np.clip((a - m[..., None] * MAGENTA) / np.maximum(alpha, 1e-3)[..., None], 0, 255)
    # The magenta is not perfectly flat, which leaves a faint haze. Keep only
    # what lies close to the solid figure.
    body = ndimage.binary_opening(alpha > 0.9, iterations=3)
    alpha[~ndimage.binary_dilation(body, iterations=3)] = 0
    alpha[alpha < 0.03] = 0
    return alpha, clean


def materials(clean, alpha):
    """Which pixels of the figure are cloth (blue) and trim (green).

    Everything that is not skin is clothing: the skin is a light neutral
    grey. Dark outlines between parts carry almost no colour, so they join
    the material nearest to them. Returns (cloth share, trim share).
    """
    hi, lo = clean.max(axis=2), clean.min(axis=2)
    colourful = hi - lo > 25
    skin = ~colourful & (clean.mean(axis=2) > 110)
    worn = (alpha > 0.03) & ~skin
    blue = colourful & (clean[..., 2] >= clean[..., 1])
    green = colourful & (clean[..., 1] > clean[..., 2])
    # Drop specks of colour, such as a fringe on the skin.
    for mask in (blue, green):
        labels, count = ndimage.label(mask)
        sizes = ndimage.sum(mask, labels, index=range(1, count + 1))
        mask &= np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s > 40])
    if not (blue | green).any():
        return np.zeros((H, W)), np.zeros((H, W))
    # Dark outlines take the material of the nearest coloured pixel.
    _, (iy, ix) = ndimage.distance_transform_edt(~(blue | green), return_indices=True)
    near_blue = blue[iy, ix]
    dist = ndimage.distance_transform_edt(~(blue | green))
    worn &= dist < 12
    cloth = (worn & near_blue).astype(np.float32)
    trim = (worn & ~near_blue).astype(np.float32)
    # Soften the edge against the skin by one pixel.
    return ndimage.uniform_filter(cloth, 2) * worn, ndimage.uniform_filter(trim, 2) * worn


def marker(clean, alpha, share, channel):
    """One material as a grey layer, from the brightness of its marker colour.
    channel: 2 for blue, 1 for green."""
    others = [c for c in range(3) if c != channel]
    level = clean[..., channel] * 0.8 + clean[..., others].mean(axis=2) * 0.2
    sure = share > 0.9
    if not sure.any():
        return np.zeros((H, W, 4))
    lo, hi = np.percentile(level[sure], [2, 98])
    grey = GREY_DARK + np.clip((level - lo) / max(hi - lo, 1), 0, 1) * (GREY_LIGHT - GREY_DARK)
    return np.dstack([grey, grey, grey, alpha * share * 255])


def figure(rgb):
    """A race's dressed figure: (skin RGBA, hands RGBA, whole-figure alpha)."""
    alpha, clean = key_magenta(rgb)
    cloth, trim = materials(clean, alpha)
    share = cloth + trim
    # The skin: its own colour where there is no cloth, else the colour of
    # the nearest pure skin, so the area under the clothes is filled.
    pure = (share < 0.05) & (alpha > 0.5)
    _, (sy, sx) = ndimage.distance_transform_edt(~pure, return_indices=True)
    skin_rgb = np.where(pure[..., None], clean, clean[sy, sx])
    skin_rgb[:] = skin_rgb.mean(axis=2, keepdims=True)
    # Under the clothes, the skin is only kept around the neck and chest,
    # for outfits with a lower collar. Further down, an outfit that leaves a
    # gap should show the background, as it does on the human it was drawn on.
    covered = share >= 0.05
    upper = pure.copy()
    upper[int(H * 0.5) :] = False
    chest = ndimage.distance_transform_edt(~upper) < 90
    skin = np.dstack([skin_rgb, alpha * 255 * (~covered | chest)])
    # The hands: the bare skin in the lower part of the figure.
    hands = skin.copy()
    hands[..., 3] *= 1 - share
    hands[: int(H * 0.6), :, 3] = 0
    # Only the two hands, not skin showing between the clothes elsewhere.
    labels, count = ndimage.label(ndimage.binary_dilation(hands[..., 3] > 128, iterations=2))
    sizes = ndimage.sum(hands[..., 3] > 128, labels, index=range(1, count + 1))
    two = np.argsort(sizes)[::-1][:2] + 1
    hands[~np.isin(labels, two), 3] = 0
    return skin, hands, alpha


def landmarks(skin):
    """Where the head and eyes are, in canvas pixels."""
    solid = skin[..., 3] > 128
    white = (skin[..., :3].min(axis=2) > 240) & solid
    white[H // 2 :] = False
    labels, count = ndimage.label(white)
    sizes = ndimage.sum(white, labels, index=range(1, count + 1))
    two = np.argsort(sizes)[::-1][:2] + 1
    eyes = []
    for i in two:
        ys, xs = np.where(labels == i)
        eyes.append([round(float(xs.mean()), 1), round(float(ys.mean()), 1)])
    eyes.sort()
    rows = np.where(solid.any(axis=1))[0]
    return {
        "top": int(rows[0]),
        "centerX": round((eyes[0][0] + eyes[1][0]) / 2, 1),
        "eyeY": round((eyes[0][1] + eyes[1][1]) / 2, 1),
        "eyes": {"left": eyes[0], "right": eyes[1]},
    }


def runs(row):
    """The solid stretches of one row, as a flat list of their edges."""
    d = np.diff(np.r_[0, row.astype(np.int8), 0])
    starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
    edges = []
    for s, e in zip(starts, ends):
        if e - s > 6:
            edges += [s, e]
    return edges


def levels(mask, eye_y, hands):
    """Rows that line up between two figures: top, eyes, armpits, wrists, bottom."""
    rows = np.where(mask.any(axis=1))[0]
    top = rows[0]
    start = int(eye_y + 150)
    armpit = next(y for y in range(start, H) if len(runs(mask[y])) >= 6)
    wrist = int(np.where((hands[..., 3] > 128).any(axis=1))[0][0])
    return np.array([top, eye_y, armpit, wrist, H - 1], float)


def body_map(src_mask, src_levels, tgt_mask, tgt_levels):
    """For every pixel of the target figure, where to read the source: the
    rows by the shared levels, within a row the stretches edge to edge."""
    ys = np.interp(np.arange(H), tgt_levels, src_levels)
    xs = np.arange(W, dtype=float)
    map_x = np.tile(xs, (H, 1))
    good = np.zeros(H, bool)
    for y in range(H):
        t = runs(tgt_mask[y])
        s = runs(src_mask[min(int(round(ys[y])), H - 1)])
        # Only rows where both figures have the same stretches can be
        # matched edge to edge (the legs split at a different height, say).
        if not t or len(t) != len(s):
            continue
        # Past the outer edges, keep the scale of the outermost stretch.
        t = [t[0] - 300, *t, t[-1] + 300]
        s = [s[0] - 300, *s, s[-1] + 300]
        map_x[y] = np.interp(xs, t, s)
        good[y] = True
    # The other rows follow the matched rows above and below them.
    rows = np.where(good)[0]
    for x in range(W):
        map_x[:, x] = np.interp(np.arange(H), rows, map_x[rows, x])
    map_x = ndimage.gaussian_filter1d(map_x, sigma=10, axis=0)
    return np.tile(ys[:, None], (1, W)), map_x


def fill_hand_holes(layers, hands):
    """The human's hands leave holes in an outfit that hangs behind them, such
    as a robe. Another race's hands are elsewhere, so the holes would show.
    Where clothing surrounds most of a hand, fill its place with the clothing
    nearest to it."""
    worn = sum(layer[..., 3] for layer in layers) > 128
    labels, count = ndimage.label(hands[..., 3] > 128)
    for i in range(1, count + 1):
        hand = ndimage.binary_dilation(labels == i, iterations=3)
        ring = ndimage.binary_dilation(hand, iterations=6) & ~ndimage.binary_dilation(hand, iterations=2)
        if worn[ring].mean() < 0.6:
            continue
        _, (iy, ix) = ndimage.distance_transform_edt(~worn, return_indices=True)
        for layer in layers:
            layer[hand] = layer[iy[hand], ix[hand]]


def warp(layer, mapping):
    map_y, map_x = mapping
    out = np.zeros_like(layer)
    for c in range(4):
        out[..., c] = ndimage.map_coordinates(layer[..., c], [map_y, map_x], order=1, mode="constant")
    return out


def to_img(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def tint(arr, rgb, grey):
    out = arr.copy()
    out[..., :3] = np.clip(out[..., :3] * np.array(rgb, np.float32) / grey, 0, 255)
    return out


def preview(skins, hands, outfits):
    """Every outfit (rows) on every race (columns), cropped to the body."""
    skin_rgb = [(238, 200, 170), (205, 150, 110), (140, 98, 70), (150, 172, 118), (180, 92, 100)]
    cloth = [(120, 90, 60), (70, 110, 80), (110, 60, 60), (70, 80, 120), (90, 70, 110)]
    trim = (150, 140, 120)
    scale = 0.18
    crop = (60, 120, 964, 1536)
    cw, ch = int((crop[2] - crop[0]) * scale), int((crop[3] - crop[1]) * scale)
    sheet = Image.new("RGB", (cw * len(RACES), ch * len(OUTFITS)), (243, 240, 250))
    for row, name in enumerate(OUTFITS):
        for col, race in enumerate(RACES):
            c, t = outfits[name][race]
            canvas = np.zeros((H, W, 3), np.float32) + (243, 240, 250)
            for layer in (
                tint(skins[race], skin_rgb[col], 205),
                tint(c, cloth[(row + col) % 5], 170),
                tint(t, trim, 170),
                tint(hands[race], skin_rgb[col], 205),
            ):
                a = layer[..., 3:4] / 255
                canvas = canvas * (1 - a) + layer[..., :3] * a
            tile = to_img(canvas).crop(crop).resize((cw, ch), Image.LANCZOS)
            sheet.paste(tile, (col * cw, row * ch))
    return sheet


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    anchors, skins, hands, masks, lv = {}, {}, {}, {}, {}
    for race in RACES:
        rgb = np.array(Image.open(SRC / f"outfit-basic-{race}.png").convert("RGB"))
        if rgb.shape[:2] != (H, W):
            raise SystemExit(f"outfit-basic-{race}.png is not {W} x {H}")
        skin, hand, alpha = figure(rgb)
        to_img(skin).save(OUT / f"{race}.png", optimize=True)
        to_img(hand).save(OUT / f"hands-{race}.png", optimize=True)
        anchors[race] = landmarks(skin)
        skins[race], hands[race], masks[race] = skin, hand, alpha > 0.5
        lv[race] = levels(masks[race], anchors[race]["eyeY"], hand)

    maps = {race: body_map(masks["human"], lv["human"], masks[race], lv[race]) for race in RACES if race != "human"}

    outfits = {}
    for name in OUTFITS:
        rgb = np.array(Image.open(SRC / "human" / f"outfit-{name}.png").convert("RGB"))
        alpha, clean = key_magenta(rgb)
        blue, green = materials(clean, alpha)
        cloth = marker(clean, alpha, blue, 2)
        trim = marker(clean, alpha, green, 1)
        fill_hand_holes([cloth, trim], hands["human"])
        outfits[name] = {}
        for race in RACES:
            c = cloth if race == "human" else warp(cloth, maps[race])
            t = trim if race == "human" else warp(trim, maps[race])
            # No outfit reaches above the mouth; the warp can leave thin
            # streaks up there.
            mouth = int(anchors[race]["eyeY"] + 60)
            c[:mouth, :, 3] = 0
            t[:mouth, :, 3] = 0
            to_img(c).save(OUT / f"outfit-{name}-{race}-cloth.png", optimize=True)
            to_img(t).save(OUT / f"outfit-{name}-{race}-trim.png", optimize=True)
            outfits[name][race] = (c, t)

    (OUT / "anchors.json").write_text(json.dumps({"width": W, "height": H, "races": anchors}, indent=2) + "\n")
    preview(skins, hands, outfits).save(SRC / "preview.png", optimize=True)
    print("levels", {race: lv[race].round().tolist() for race in RACES})


if __name__ == "__main__":
    main()
