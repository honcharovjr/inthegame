"""Lifts the hair and beards out of the AI-edited human bodies.

Input: art/character-hair/{name}.png, the human body from
art/character-bases/human.png with one hairstyle or beard added in pure blue.
Blue appears nowhere else, so the blue shows exactly what was added.
Output: art/character-hair/cut/{name}.png, full canvas, grey and transparent,
to be tinted to any hair colour in the app, and
art/character-hair/cut/fit.json, which says how to scale each part to fit the
head of each race. art/character-hair/preview.png shows them on the races.

Run after scripts/key_character_bases.py and
scripts/key_character_outfits.py, with pillow, numpy and scipy:
    python3 scripts/key_character_hair.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "character-hair"
BASE = ROOT / "art" / "character-bases" / "human.png"
# The bare human the hair was drawn on, and the dressed figures it goes on.
REF = ROOT / "art" / "character-bases" / "cut"
BODIES = ROOT / "art" / "character-outfits" / "cut"
OUT = SRC / "cut"

HAIR = ["hair-short", "hair-long", "hair-topknot", "hair-braids", "hair-mohawk"]
BEARDS = ["beard-short", "beard-long", "beard-braided", "beard-goatee", "beard-moustache"]
RACES = ["human", "elf", "dwarf", "orc", "tiefling"]

# The grey range the hair is stored in. Light enough that a tint by
# multiplying keeps its colour, dark enough that the shading still reads.
GREY_DARK, GREY_LIGHT = 70.0, 235.0

# Where the human's ears are on the canvas: rows, and columns of each ear.
EAR_ROWS = (250, 380)
EAR_COLUMNS = [(330, 430), (594, 694)]


def blueness(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return b - np.maximum(r, g)


def extract(edit, base):
    """The added hair as grey RGBA.

    How blue a pixel is, against how blue the full hair near it is, gives its
    opacity: the background and the grey skin have no blue at all. The
    brightness of the blue becomes the grey.
    """
    e = edit.astype(np.float32)
    d = blueness(e)
    sure = d > 60
    # Drop specks: keep only clumps of real size.
    labels, count = ndimage.label(ndimage.binary_dilation(sure, iterations=2))
    sizes = ndimage.sum(sure, labels, index=range(1, count + 1))
    keep = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s > 150])
    sure &= keep
    # The blueness of solid hair around each pixel, to compare edges with.
    full = ndimage.maximum_filter(np.where(sure, d, 0), size=7)
    near = ndimage.binary_dilation(sure, iterations=3)
    alpha = np.where(near & (full > 0), np.clip(d / np.maximum(full, 1), 0, 1), 0)
    alpha[sure] = np.maximum(alpha[sure], 0.0)
    # The colour of the hair alone: take out the share of the base behind it.
    b = base.astype(np.float32)
    safe = np.maximum(alpha, 0.05)[..., None]
    hair = np.clip((e - (1 - alpha)[..., None] * b) / safe, 0, 255)
    # Brightness of the blue, from dark navy to bright blue, as grey.
    level = hair[..., 2] * 0.8 + hair[..., :2].mean(axis=2) * 0.2
    lo, hi = np.percentile(level[sure], [2, 98])
    grey = GREY_DARK + np.clip((level - lo) / max(hi - lo, 1), 0, 1) * (GREY_LIGHT - GREY_DARK)
    # A faint edge pixel holds too little hair to solve its colour, which
    # leaves a light rim. It takes the grey of the nearest solid hair instead.
    solid = alpha > 0.6
    _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    grey = np.where(solid, grey, grey[iy, ix])
    # The human's ears were drawn in front of long hair, which leaves an
    # ear-shaped hole in it. Other races have their ears elsewhere, so the
    # hole would show the background: fill it with the hair around it.
    for x0, x1 in EAR_COLUMNS:
        box = (slice(EAR_ROWS[0], EAR_ROWS[1]), slice(x0, x1))
        hole = ndimage.binary_fill_holes(alpha[box] > 0.5) & (alpha[box] <= 0.5)
        alpha[box][hole] = 1.0
    out = np.dstack([grey, grey, grey, alpha * 255]).astype(np.uint8)
    out[alpha < 0.04] = 0
    return out


def head(race, anchors, folder=BODIES):
    """The measures of a race's head that hair and beards are fitted to."""
    a = anchors[race]
    alpha = np.array(Image.open(folder / f"{race}.png"))[..., 3] > 128
    cx = int(round(a["centerX"]))
    # The top of the skull straight above the nose, so horns do not count.
    top = int(np.where(alpha[:, cx - 6 : cx + 7].any(axis=1))[0][0])
    eye_y = a["eyeY"]
    (lx, _), (rx, _) = a["eyes"]["left"], a["eyes"]["right"]
    # The width of the jaw, halfway from the eyes down to the chin.
    jaw_y = int(eye_y + 0.5 * (eye_y - top))
    xs = np.where(alpha[jaw_y, cx - 200 : cx + 200])[0]
    return {
        "top": top,
        "eyeX": (lx + rx) / 2,
        "eyeY": eye_y,
        "eyeGap": rx - lx,
        "jawWidth": float(xs[-1] - xs[0]),
    }


def fits(anchors, ref_anchors):
    """How to move each kind of part from the bare human it was drawn on onto
    each dressed race: scale around the eyes of the human, then move to the
    eyes of the race."""
    human = head("human", ref_anchors, REF)
    out = {}
    for race in RACES:
        h = head(race, anchors)
        sx = h["eyeGap"] / human["eyeGap"]
        sy = (h["eyeY"] - h["top"]) / (human["eyeY"] - human["top"])
        jaw = h["jawWidth"] / human["jawWidth"]
        out[race] = {
            "hair": {"sx": round(sx, 4), "sy": round(sy, 4)},
            "beard": {"sx": round(jaw, 4), "sy": round((sx + sy) / 2, 4)},
            "from": [round(human["eyeX"], 1), round(human["eyeY"], 1)],
            "to": [round(h["eyeX"], 1), round(h["eyeY"], 1)],
        }
    return out


def place(img, fit, kind):
    """Draws a part onto a race's canvas, as the app will."""
    s = fit[kind]
    fx, fy = fit["from"]
    tx, ty = fit["to"]
    w, h = img.size
    # Canvas pixel (x, y) shows part pixel ((x - tx) / sx + fx, ...).
    matrix = (1 / s["sx"], 0, fx - tx / s["sx"], 0, 1 / s["sy"], fy - ty / s["sy"])
    return img.transform((w, h), Image.AFFINE, matrix, Image.BICUBIC)


def tint(img, rgb):
    a = np.array(img).astype(np.float32)
    a[..., :3] = a[..., :3] * np.array(rgb, np.float32) / 255
    return Image.fromarray(a.astype(np.uint8))


def preview(parts, fit, anchors):
    """Every race with a few hair and beard pairs, in a few colours."""
    skins = [(241, 205, 178), (198, 140, 100), (120, 82, 60), (150, 170, 120), (170, 90, 100)]
    pairs = [
        ("hair-short", "beard-short", (60, 40, 30)),
        ("hair-long", None, (235, 205, 140)),
        ("hair-topknot", "beard-goatee", (30, 30, 35)),
        ("hair-braids", "beard-braided", (190, 80, 40)),
        ("hair-mohawk", "beard-moustache", (210, 210, 220)),
        (None, "beard-long", (120, 70, 40)),
    ]
    scale = 0.4
    crop = (212, 0, 812, 760)
    cw, ch = int((crop[2] - crop[0]) * scale), int((crop[3] - crop[1]) * scale)
    sheet = Image.new("RGB", (cw * len(pairs), ch * len(RACES)), (243, 240, 250))
    for row, race in enumerate(RACES):
        bare = Image.open(BODIES / f"{race}.png").convert("RGBA")
        body = tint(bare, skins[row])
        for part in ("cloth", "trim"):
            body.alpha_composite(tint(Image.open(BODIES / f"outfit-tunic-{race}-{part}.png"), (110, 85, 60)))
        h = head(race, anchors)
        for col, (hair, beard, colour) in enumerate(pairs):
            canvas = Image.new("RGBA", body.size, (243, 240, 250, 255))
            canvas.alpha_composite(body)
            for name, kind in ((beard, "beard"), (hair, "hair")):
                if name:
                    canvas.alpha_composite(tint(place(parts[name], fit[race], kind), colour))
            if race == "tiefling":
                canvas.alpha_composite(horns(tint(bare, skins[row]), h))
            tile = canvas.crop(crop).resize((cw, ch), Image.LANCZOS)
            sheet.paste(tile.convert("RGB"), (col * cw, row * ch))
    return sheet


def horns(body, h):
    """The tiefling's horns, drawn again over the hair."""
    a = np.array(body)
    mask = horn_mask(a[..., 3] > 0, h)
    a[~mask] = 0
    return Image.fromarray(a)


def horn_mask(solid, h):
    """Everything of the tiefling above its skull: the horns. The skull is the
    round middle, so cut an oval around it and keep the rest of the top band.
    h: the head measures from head(). Sizes are shares of the height from the
    top of the skull to the eyes."""
    size = h["eyeY"] - h["top"]
    ys, xs = np.mgrid[0 : solid.shape[0], 0 : solid.shape[1]]
    cy = h["top"] + 0.66 * size
    skull = ((xs - h["eyeX"]) / (0.71 * size)) ** 2 + ((ys - cy) / (0.66 * size)) ** 2 <= 1
    return solid & (ys < h["top"] + 0.72 * size) & ~skull


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    base = np.array(Image.open(BASE).convert("RGB"))
    parts = {}
    for name in HAIR + BEARDS:
        edit = np.array(Image.open(SRC / f"{name}.png").convert("RGB"))
        img = Image.fromarray(extract(edit, base))
        img.save(OUT / f"{name}.png", optimize=True)
        parts[name] = img
    anchors = json.loads((BODIES / "anchors.json").read_text())["races"]
    ref_anchors = json.loads((REF / "anchors.json").read_text())["races"]
    fit = fits(anchors, ref_anchors)
    (OUT / "fit.json").write_text(json.dumps(fit, indent=2) + "\n")
    preview(parts, fit, anchors).save(SRC / "preview.png", optimize=True)
    print(json.dumps(fit, indent=1))


if __name__ == "__main__":
    main()
