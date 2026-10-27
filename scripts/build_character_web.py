"""Builds the character art the site loads, from the cut layers.

Input: art/character-bases/cut/ and art/character-hair/cut/, made by
scripts/key_character_bases.py and scripts/key_character_hair.py.
Output:
- public/character/{name}.webp: every layer at 3/4 size, light for the web
- public/character/eyes-{race}.webp: the eye whites alone, drawn untinted
  over the skin, and a mask for the irises
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

ROOT = Path(__file__).resolve().parent.parent
BASES = ROOT / "art" / "character-bases" / "cut"
HAIR = ROOT / "art" / "character-hair" / "cut"
OUT = ROOT / "public" / "character"
ART_JSON = ROOT / "src" / "lib" / "character" / "art.json"

RACES = ["human", "elf", "dwarf", "orc", "tiefling"]
W, H = 1024, 1536
WEB_SCALE = 0.75

# The full figure: wide enough for the broadest arms, down to the waist.
FULL = {"x": 96, "y": 0, "w": 832, "h": 1180}


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


def horns(rgba):
    """The tiefling's horns: what is above the skull, outside a disc around it."""
    ys, xs = np.mgrid[0:H, 0:W]
    skull = ((xs - 511) / 108.0) ** 2 + ((ys - 240) / 100.0) ** 2 <= 1
    out = rgba.copy()
    out[(ys >= 250) | skull] = 0
    return Image.fromarray(out)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    anchors = json.loads((BASES / "anchors.json").read_text())["races"]
    fit = json.loads((HAIR / "fit.json").read_text())
    races = {}
    for race in RACES:
        img = Image.open(BASES / f"{race}.png").convert("RGBA")
        rgba = np.array(img)
        save_web(img, race)
        whites, eyes = eye_whites(rgba)
        save_web(whites, f"eyes-{race}")
        if race == "tiefling":
            save_web(horns(rgba), "horns-tiefling")

        a = anchors[race]
        solid = rgba[..., 3] > 128
        cx = int(round(a["centerX"]))
        top = int(np.where(solid[:, cx - 6 : cx + 7].any(axis=1))[0][0])
        head = a["eyeY"] - top
        size = head * 2.9
        eye_x = (eyes[0]["cx"] + eyes[1]["cx"]) / 2
        # The skin's own grey, so a tint shows the chosen colour, not a darker one.
        skin = rgba[..., :3][solid & (rgba[..., :3].min(axis=2) < 225)].mean(axis=1)
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

    art = {"width": W, "height": H, "full": FULL, "races": races}
    ART_JSON.write_text(json.dumps(art, indent=2) + "\n")
    total = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"{len(list(OUT.glob('*.webp')))} files, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
