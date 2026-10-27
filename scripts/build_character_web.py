"""Builds the character art the site loads, from the cut layers.

Input: art/character-outfits/cut/ and art/character-hair/cut/, made by
scripts/key_character_outfits.py and scripts/key_character_hair.py.
Output:
- public/character/{name}.webp: every layer at 3/4 size, light for the web
- public/character/eyes-{race}.webp: the eye whites alone, drawn untinted
  over the skin, and a mask for the irises
- public/character/hands-{race}.webp: the bare hands, drawn over the clothes
- public/character/outfit-{name}-{race}-cloth.webp and -trim.webp: each
  outfit fitted to each race, tinted in the app
- public/character/horns-tiefling.webp: the horns again, drawn over the hair
- src/lib/character/art.json: the measures the renderer needs, in pixels of
  the full 1024 x 1536 canvas

    python3 scripts/build_character_web.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from key_character_hair import head as head_measures, horn_mask

ROOT = Path(__file__).resolve().parent.parent
BASES = ROOT / "art" / "character-outfits" / "cut"
HAIR = ROOT / "art" / "character-hair" / "cut"
OUT = ROOT / "public" / "character"
ART_JSON = ROOT / "src" / "lib" / "character" / "art.json"

RACES = ["human", "elf", "dwarf", "orc", "tiefling"]
W, H = 1024, 1536
WEB_SCALE = 0.75

OUTFITS = ["tunic", "leather", "chainmail", "plate", "robe", "ranger", "doublet", "fur", "coat", "cleric"]


def save_web(img, name):
    size = (round(W * WEB_SCALE), round(H * WEB_SCALE))
    img.resize(size, Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=88, method=6)


def eye_whites(rgba):
    """The two eye whites: an image of them alone, and their boxes."""
    rgb = rgba[..., :3].astype(np.float32)
    lo = rgb.min(axis=2)
    solid = rgba[..., 3] > 200
    white = (lo > 225) & solid
    white[H // 2 :] = False
    labels, count = ndimage.label(white)
    sizes = ndimage.sum(white, labels, index=range(1, count + 1))
    two = [int(i) + 1 for i in np.argsort(sizes)[::-1][:2]]
    mask = np.isin(labels, two)
    # A soft rim, so the whites blend into the lids.
    grown = ndimage.binary_dilation(mask, iterations=2)
    soft = np.clip((lo - 205) / 30, 0, 1) * grown
    out = rgba.copy()
    out[..., 3] = (soft * 255).astype(np.uint8)
    boxes = []
    for i in two:
        ys, xs = np.where(labels == i)
        boxes.append(
            {
                "cx": round(float(xs.mean()), 1),
                "cy": round(float(ys.mean()), 1),
                "rx": round((xs.max() - xs.min() + 1) / 2, 1),
                "ry": round((ys.max() - ys.min() + 1) / 2, 1),
            }
        )
    boxes.sort(key=lambda b: b["cx"])
    return Image.fromarray(out), boxes


def horns(rgba, h):
    """The tiefling's horns alone."""
    out = rgba.copy()
    out[~horn_mask(rgba[..., 3] > 0, h)] = 0
    return Image.fromarray(out)


def full_box(figures):
    """The whole figure of every race, with a margin: one shared box, so all
    full views have the same size."""
    solid = np.zeros((H, W), bool)
    for alpha in figures:
        solid |= alpha > 128
    ys, xs = np.where(solid)
    pad = 24
    x0, x1 = max(0, xs.min() - pad), min(W, xs.max() + pad)
    y0 = max(0, ys.min() - pad)
    return {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(H - y0)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    anchors = json.loads((BASES / "anchors.json").read_text())["races"]
    fit = json.loads((HAIR / "fit.json").read_text())
    races = {}
    figures = []
    for race in RACES:
        img = Image.open(BASES / f"{race}.png").convert("RGBA")
        rgba = np.array(img)
        save_web(img, race)
        whites, eyes = eye_whites(rgba)
        save_web(whites, f"eyes-{race}")
        if race == "tiefling":
            save_web(horns(rgba, head_measures(race, anchors)), "horns-tiefling")
        save_web(Image.open(BASES / f"hands-{race}.png").convert("RGBA"), f"hands-{race}")
        worn = np.zeros((H, W), np.uint8)
        for outfit in OUTFITS:
            for part in ("cloth", "trim"):
                layer = Image.open(BASES / f"outfit-{outfit}-{race}-{part}.png").convert("RGBA")
                save_web(layer, f"outfit-{outfit}-{race}-{part}")
                worn = np.maximum(worn, np.array(layer)[..., 3])
        figures.append(np.maximum(rgba[..., 3], worn))

        a = anchors[race]
        solid = rgba[..., 3] > 128
        cx = int(round(a["centerX"]))
        top = int(np.where(solid[:, cx - 6 : cx + 7].any(axis=1))[0][0])
        head = a["eyeY"] - top
        size = head * 2.9
        eye_x = (eyes[0]["cx"] + eyes[1]["cx"]) / 2
        # The skin's own grey, so a tint shows the chosen colour, not a darker
        # one. Only the skin that shows: not under the clothes, not the eyes.
        tunic = [np.array(Image.open(BASES / f"outfit-tunic-{race}-{p}.png"))[..., 3] for p in ("cloth", "trim")]
        bare = np.maximum(*tunic) < 10
        skin = rgba[..., :3][solid & bare & (rgba[..., :3].min(axis=2) < 225)].mean(axis=1)
        races[race] = {
            "eyes": eyes,
            "skinGrey": round(float(np.median(skin)), 1),
            "portrait": {
                "x": round(eye_x - size / 2, 1),
                "y": round(top - head * 0.35, 1),
                "w": round(size, 1),
                "h": round(size, 1),
            },
            "horns": race == "tiefling",
            "fit": fit[race],
        }

    parts = sorted(p.stem for p in HAIR.glob("*.png"))
    for name in parts:
        save_web(Image.open(HAIR / f"{name}.png").convert("RGBA"), name)

    art = {"width": W, "height": H, "full": full_box(figures), "races": races}
    ART_JSON.write_text(json.dumps(art, indent=2) + "\n")
    total = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"{len(list(OUT.glob('*.webp')))} files, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
