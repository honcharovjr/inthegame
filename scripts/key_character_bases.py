"""Cuts the five race bodies out of their flat backgrounds.

Input: art/character-bases/{race}.png, 1024 x 1536, drawn on flat magenta
(#FF00FF) with a flat green (#00FF00) placeholder below the waist.
Output: art/character-bases/cut/{race}.png, full canvas, transparent where the
magenta and green were, and art/character-bases/cut/anchors.json with the
landmarks of every body. art/character-bases/preview.png shows all five on a
light and a dark background, to check the edges.

Run with a Python that has pillow, numpy and scipy:
    python3 scripts/key_character_bases.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "character-bases"
OUT = SRC / "cut"

RACES = ["human", "elf", "dwarf", "orc", "tiefling"]
W, H = 1024, 1536

MAGENTA = np.array([255.0, 0.0, 255.0])
GREEN = np.array([0.0, 255.0, 0.0])


def key_out(rgb):
    """Returns RGBA with the magenta and green made transparent.

    The figure is near-neutral grey, so on an edge any rise of red and blue
    above green is magenta, and any rise of green above red and blue is the
    green placeholder. That share is the transparency, and the key colour is
    taken back out of the pixel, so no pink or green fringe is left.
    """
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.clip(np.minimum(r, b) - g, 0, 255) / 255.0
    n = np.clip(g - np.maximum(r, b), 0, 255) / 255.0
    alpha = np.clip(1.0 - m - n, 0, 1)
    safe = np.maximum(alpha, 1e-3)[..., None]
    clean = (a - m[..., None] * MAGENTA - n[..., None] * GREEN) / safe
    clean = np.clip(clean, 0, 255)
    # Faint edge pixels carry too little colour to solve: use their own grey.
    faint = alpha < 0.25
    clean[faint] = clean[faint].mean(axis=1, keepdims=True)
    # Where the green meets the magenta, a pixel is half of each, which reads
    # as solid grey: a thin false line around the green area. Real figure
    # pixels belong to a thick body, the line is a few pixels wide, so keep
    # only what lies close to the thick body.
    body = ndimage.binary_opening(alpha > 0.9, iterations=3)
    alpha[~ndimage.binary_dilation(body, iterations=3)] = 0
    out = np.dstack([clean, alpha * 255.0]).astype(np.uint8)
    out[alpha < 0.03] = 0
    return out


def landmarks(rgba, rgb):
    """Where the head, eyes, neck, shoulders and waist are, in canvas pixels."""
    solid = rgba[..., 3] > 128
    rows = np.where(solid.any(axis=1))[0]
    top = int(rows[0])

    def span(y):
        xs = np.where(solid[y])[0]
        return (int(xs[0]), int(xs[-1])) if len(xs) else (0, 0)

    # The eyes are the only near-white areas in the upper half.
    white = (rgb.min(axis=2) > 240) & solid
    white[H // 2 :] = False
    ys, xs = np.where(white)
    eye_y = float(ys.mean())
    cx = float(xs.mean())
    left = xs < cx
    eyes = {
        "left": [round(float(xs[left].mean()), 1), round(float(ys[left].mean()), 1)],
        "right": [round(float(xs[~left].mean()), 1), round(float(ys[~left].mean()), 1)],
    }

    # The green placeholder starts at the waist.
    g = rgb.astype(int)
    green = (g[..., 1] > 200) & (g[..., 0] < 90) & (g[..., 2] < 90)
    waist_y = int(np.where(green.any(axis=1))[0][0])

    # The neck: the narrowest row between the ears and the shoulders.
    band = range(int(eye_y) + 90, int(eye_y) + 260)
    neck_y = min(band, key=lambda y: span(y)[1] - span(y)[0])
    neck = span(neck_y)
    # The shoulders: the first row below the neck where the figure is twice
    # as wide as the neck.
    neck_w = neck[1] - neck[0]
    shoulder_y = next(y for y in range(neck_y, waist_y) if span(y)[1] - span(y)[0] > 2 * neck_w)
    # The widest the figure gets between shoulders and waist.
    widest = max(range(shoulder_y, waist_y), key=lambda y: span(y)[1] - span(y)[0])
    return {
        "top": top,
        "centerX": round(cx, 1),
        "eyeY": round(eye_y, 1),
        "eyes": eyes,
        "neckY": int(neck_y),
        "neckLeft": neck[0],
        "neckRight": neck[1],
        "shoulderY": int(shoulder_y),
        "armsLeft": span(widest)[0],
        "armsRight": span(widest)[1],
        "waistY": waist_y,
    }


def preview(images):
    """All bodies in a row, on a light band and on a dark band."""
    scale = 0.35
    w, h = int(W * scale), int(H * scale)
    sheet = Image.new("RGBA", (w * len(images), h * 2), (0, 0, 0, 255))
    for i, img in enumerate(images):
        small = img.resize((w, h), Image.LANCZOS)
        for row, bg in enumerate([(243, 240, 250, 255), (40, 36, 52, 255)]):
            tile = Image.new("RGBA", (w, h), bg)
            tile.alpha_composite(small)
            sheet.paste(tile, (i * w, row * h))
    return sheet.convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    anchors = {}
    cut = []
    for race in RACES:
        rgb = np.array(Image.open(SRC / f"{race}.png").convert("RGB"))
        if rgb.shape[:2] != (H, W):
            raise SystemExit(f"{race}.png is {rgb.shape[1]} x {rgb.shape[0]}, expected {W} x {H}")
        rgba = key_out(rgb)
        img = Image.fromarray(rgba)
        img.save(OUT / f"{race}.png", optimize=True)
        anchors[race] = landmarks(rgba, rgb)
        cut.append(img)
    anchors = {"width": W, "height": H, "races": anchors}
    (OUT / "anchors.json").write_text(json.dumps(anchors, indent=2) + "\n")
    preview(cut).save(SRC / "preview.png", optimize=True)
    print(json.dumps(anchors, indent=1))


if __name__ == "__main__":
    main()
