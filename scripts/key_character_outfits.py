"""Cuts the dressed race figures into a skin layer and an outfit layer.

Input: art/character-outfits/outfit-basic-{race}.png, a race body dressed by
the AI in clothes drawn in pure blue, on flat magenta. Each of these is a
complete figure: the skin and the clothes come from the same image, so they
always line up.
Output, in art/character-outfits/cut/:
- {race}.png: the skin (head, neck, hands), grey, to be tinted. It also
  fills the area under the clothes, so no gap shows at their edges
- outfit-basic-{race}.png: the clothes alone, grey, to be tinted
- anchors.json: where the head and eyes are, for fitting hair
- art/character-outfits/preview.png: every race dressed, in a few colours

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
OUTFITS = ["basic"]
W, H = 1024, 1536

MAGENTA = np.array([255.0, 0.0, 255.0])
# The grey range the clothes are stored in, as for hair.
GREY_DARK, GREY_LIGHT = 60.0, 235.0


def cut(rgb):
    """Returns (skin RGBA, outfit RGBA) as float arrays."""
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # The figure against the magenta: the share of magenta is transparency.
    m = np.clip(np.minimum(r, b) - g, 0, 255) / 255.0
    alpha = np.clip(1.0 - m, 0, 1)
    clean = np.clip((a - m[..., None] * MAGENTA) / np.maximum(alpha, 1e-3)[..., None], 0, 255)
    # The magenta is not perfectly flat, which leaves a faint haze. Keep only
    # what lies close to the solid figure.
    body = ndimage.binary_opening(alpha > 0.9, iterations=3)
    alpha[~ndimage.binary_dilation(body, iterations=3)] = 0
    alpha[alpha < 0.03] = 0

    # The clothes: how blue a pixel is against the full blue of the clothes
    # around it. Grey skin has no blue at all.
    d = clean[..., 2] - np.maximum(clean[..., 0], clean[..., 1])
    sure = (d > 60) & (alpha > 0.5)
    labels, count = ndimage.label(sure)
    sizes = ndimage.sum(sure, labels, index=range(1, count + 1))
    sure &= np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s > 150])
    full = ndimage.maximum_filter(np.where(sure, d, 0), size=7)
    near = ndimage.binary_dilation(sure, iterations=3)
    share = np.where(near & (full > 0), np.clip(d / np.maximum(full, 1), 0, 1), 0)
    share[sure] = 1.0

    # Clothes as grey, from the brightness of the blue.
    level = clean[..., 2] * 0.8 + clean[..., :2].mean(axis=2) * 0.2
    lo, hi = np.percentile(level[sure], [2, 98])
    grey = GREY_DARK + np.clip((level - lo) / max(hi - lo, 1), 0, 1) * (GREY_LIGHT - GREY_DARK)
    # Faint edge pixels take the grey of the nearest solid cloth.
    solid = share > 0.6
    _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    grey = np.where(solid, grey, grey[iy, ix])
    outfit = np.dstack([grey, grey, grey, alpha * share * 255])

    # The skin: its own colour where there is no cloth, else the colour of
    # the nearest pure skin, so the area under the clothes is filled.
    pure = (share < 0.05) & (alpha > 0.5)
    _, (sy, sx) = ndimage.distance_transform_edt(~pure, return_indices=True)
    skin_rgb = np.where(pure[..., None], clean, clean[sy, sx])
    # The skin is neutral grey; drop any blue left on its edge.
    skin_rgb[:] = skin_rgb.mean(axis=2, keepdims=True)
    skin = np.dstack([skin_rgb, alpha * 255])
    return skin, outfit


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
    cx = (eyes[0][0] + eyes[1][0]) / 2
    rows = np.where(solid.any(axis=1))[0]
    return {
        "top": int(rows[0]),
        "centerX": round(cx, 1),
        "eyeY": round((eyes[0][1] + eyes[1][1]) / 2, 1),
        "eyes": {"left": eyes[0], "right": eyes[1]},
    }


def tint(img, rgb):
    a = np.array(img).astype(np.float32)
    a[..., :3] = np.clip(a[..., :3] * np.array(rgb, np.float32) / 200, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def preview(layers):
    skins = [(241, 205, 178), (198, 140, 100), (120, 82, 60), (150, 170, 120), (170, 90, 100)]
    cloth = [(120, 90, 60), (70, 110, 80), (110, 60, 60), (70, 80, 120), (90, 70, 110)]
    scale = 0.3
    w, h = int(W * scale), int(H * scale)
    sheet = Image.new("RGB", (w * len(RACES), h), (243, 240, 250))
    for i, race in enumerate(RACES):
        skin, outfit = layers[race]
        canvas = Image.new("RGBA", (W, H), (243, 240, 250, 255))
        canvas.alpha_composite(tint(skin, skins[i]))
        canvas.alpha_composite(tint(outfit, cloth[i]))
        sheet.paste(canvas.resize((w, h), Image.LANCZOS).convert("RGB"), (i * w, 0))
    return sheet


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    anchors = {}
    layers = {}
    for race in RACES:
        for outfit_name in OUTFITS:
            rgb = np.array(Image.open(SRC / f"outfit-{outfit_name}-{race}.png").convert("RGB"))
            if rgb.shape[:2] != (H, W):
                raise SystemExit(f"outfit-{outfit_name}-{race}.png is not {W} x {H}")
            skin, outfit = cut(rgb)
            skin_img = Image.fromarray(skin.astype(np.uint8))
            outfit_img = Image.fromarray(outfit.astype(np.uint8))
            outfit_img.save(OUT / f"outfit-{outfit_name}-{race}.png", optimize=True)
            # One skin per race: the basic outfit's figure is the canonical one.
            if outfit_name == "basic":
                skin_img.save(OUT / f"{race}.png", optimize=True)
                anchors[race] = landmarks(skin)
                layers[race] = (skin_img, outfit_img)
    (OUT / "anchors.json").write_text(json.dumps({"width": W, "height": H, "races": anchors}, indent=2) + "\n")
    preview(layers).save(SRC / "preview.png", optimize=True)
    print(json.dumps(anchors, indent=1))


if __name__ == "__main__":
    main()
