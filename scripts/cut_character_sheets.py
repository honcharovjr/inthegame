"""Cuts the AI-drawn character sheets into transparent parts.

Input: the three sheets in art/character-sheets/ (flat magenta background).
Output: one transparent PNG per part in public/character/, and
public/character/anchors.json with the landmarks of every body.

Run with a Python that has pillow, numpy and scipy:
    python3 scripts/cut_character_sheets.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SHEETS = ROOT / "art" / "character-sheets"
OUT = ROOT / "public" / "character"

# Names in reading order: left to right, top to bottom.
BODIES = ["human-male", "human-female", "elf", "dwarf", "orc"]
HAIR = ["short", "long", "ponytail", "mohawk", "braids"]
BEARDS = ["stubble", "full", "braided", "goatee", "moustache"]
OUTFITS = ["tunic", "robe", "plate", "leather", "cloak"]
HEADWEAR = ["wizard-hat", "viking-helm", "hood", "crown", "knight-helm"]
HELD = ["staff", "sword", "shield", "spellbook", "lantern"]

SHEET_PARTS = {
    "sheet-a-bodies.png": [("body", BODIES)],
    "sheet-b-hair.png": [("hair", HAIR), ("beard", BEARDS)],
    "sheet-c-gear.png": [("outfit", OUTFITS), ("headwear", HEADWEAR), ("held", HELD)],
}


def key_out_magenta(rgb):
    """Returns an RGBA image with the magenta background made transparent.

    A pixel on the edge is a mix of the real colour and magenta. How much
    magenta it holds is read from how far red and blue rise above green. The
    magenta is then taken back out of the colour, so no pink fringe is left.
    """
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    magenta = np.clip(np.minimum(r, b) - g, 0, 255) / 255.0
    # Only treat strongly magenta pixels as background, the rest as artwork.
    alpha = 1.0 - np.clip((magenta - 0.15) / 0.75, 0, 1)
    safe = np.maximum(alpha, 1e-3)[..., None]
    bg = np.array([255.0, 0.0, 255.0], dtype=np.float32)
    clean = (a - (1 - alpha)[..., None] * bg) / safe
    clean = np.clip(clean, 0, 255)
    out = np.dstack([clean, alpha * 255.0]).astype(np.uint8)
    out[alpha < 0.02] = 0
    return out


def key_out_grey(rgb):
    """Exact keying for parts painted in neutral grey (hair, beards). Every
    pixel is grey mixed with magenta, so both the opacity and the grey can be
    solved exactly, which leaves no coloured fringe on fine strands."""
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.clip((np.minimum(r, b) - g) / 255.0, 0, 1)
    alpha = np.clip(1.0 - m, 0, 1)
    grey = np.clip(g / np.maximum(alpha, 0.04), 0, 255)
    out = np.dstack([grey, grey, grey, alpha * 255.0]).astype(np.uint8)
    out[alpha < 0.05] = 0
    return out


def find_parts(alpha, expected, merge=14):
    """Finds the separate items on a sheet, in reading order."""
    solid = alpha > 100
    # Grow the mask so thin pieces of one item (a sword guard, a braid end)
    # join up, then label the blobs.
    grown = ndimage.binary_dilation(solid, iterations=merge)
    labels, count = ndimage.label(grown)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        area = int((labels[sl] == i).sum())
        if area < 3000:
            continue
        ys, xs = sl
        boxes.append((ys.start, ys.stop, xs.start, xs.stop))
    return boxes


def split_figures(alpha, count):
    """Finds a row of separate figures. The biggest blobs are the figures, any
    smaller piece (a finger, a toe) joins the figure it is closest to."""
    solid = alpha > 100
    labels, total = ndimage.label(solid)
    objects = ndimage.find_objects(labels)
    sizes = ndimage.sum(solid, labels, index=range(1, total + 1))
    order = np.argsort(sizes)[::-1]
    mains = [int(i) for i in order[:count]]
    boxes = {i: list(objects[i][0].indices(alpha.shape[0])[:2]) + list(objects[i][1].indices(alpha.shape[1])[:2]) for i in mains}
    for i in order[count:]:
        if sizes[i] < 40:
            continue
        sy, sx = objects[i]
        cx = (sx.start + sx.stop) / 2
        near = min(mains, key=lambda m: abs(cx - (boxes[m][2] + boxes[m][3]) / 2))
        box = boxes[near]
        box[0], box[1] = min(box[0], sy.start), max(box[1], sy.stop)
        box[2], box[3] = min(box[2], sx.start), max(box[3], sx.stop)
    return [tuple(boxes[i]) for i in mains]


def order_boxes(boxes, rows):
    """Sorts boxes into rows (top to bottom), then left to right."""
    boxes = sorted(boxes, key=lambda b: (b[0] + b[1]) / 2)
    per_row = len(boxes) // rows
    ordered = []
    for r in range(rows):
        row = boxes[r * per_row : (r + 1) * per_row]
        ordered += sorted(row, key=lambda b: (b[2] + b[3]) / 2)
    return ordered


def body_anchors(img):
    """Landmarks of a cropped body: where the head, neck, shoulders, feet are."""
    alpha = np.array(img)[..., 3] > 100
    h, w = alpha.shape
    rows = np.where(alpha.any(axis=1))[0]
    top, bottom = int(rows[0]), int(rows[-1])
    height = bottom - top

    def span(y):
        xs = np.where(alpha[y])[0]
        return (int(xs[0]), int(xs[-1])) if len(xs) else (0, 0)

    # About 7.5 heads tall: the chin is a head's height below the top.
    chin_y = top + int(height * 0.133)
    # Skull width above the ears, so pointed ears and tusks do not count.
    skull_y = top + int(height * 0.04)
    head_w = span(skull_y)[1] - span(skull_y)[0]
    # Width of the lower face, where a beard hangs from.
    jaw_y = chin_y - int(height * 0.025)
    jaw_w = span(jaw_y)[1] - span(jaw_y)[0]
    head = alpha[top : top + int(height * 0.08)]
    head_cx = float(np.where(head.any(axis=0))[0].mean())
    # The neck is the narrowest row between the head and the shoulders.
    band = range(top + int(height * 0.10), top + int(height * 0.20))
    widths = [(span(y)[1] - span(y)[0], y) for y in band]
    neck_y = min(widths)[1]
    shoulder_y = top + int(height * 0.22)
    s0, s1 = span(shoulder_y)
    return {
        "width": w,
        "height": h,
        "top": top,
        "bottom": bottom,
        "headCenterX": round(head_cx, 1),
        "neckY": neck_y,
        "chinY": chin_y,
        "headWidth": head_w,
        "jawWidth": jaw_w,
        "shoulderY": shoulder_y,
        "shoulderLeft": s0,
        "shoulderRight": s1,
    }


def clear_dark_holes(img, zones=None):
    """Makes the dark inside of a garment (neck hole, cuffs) transparent, so
    the body shows through when it is worn. Thin dark outlines are kept: only
    large dark areas are removed, and only inside the given zones.
    zones: list of (x0, x1, y0, y1) as fractions of the image, or None for all."""
    arr = np.array(img)
    h, w = arr.shape[:2]
    lum = arr[..., :3].astype(np.float32).mean(axis=2)
    dark = (lum < 48) & (arr[..., 3] > 100)
    core = ndimage.binary_erosion(dark, iterations=5)
    holes = ndimage.binary_dilation(core, iterations=8) & dark
    if zones:
        # Around the neck the rim of the collar is dark too: clear it as well.
        rim = (lum < 80) & (arr[..., 3] > 100)
        near = ndimage.binary_dilation(holes, iterations=7) & rim
        neck = np.zeros_like(near)
        x0, x1, y0, y1 = zones[0]
        neck[int(h * y0) : int(h * y1), int(w * x0) : int(w * x1)] = True
        holes |= near & neck
    if zones:
        allowed = np.zeros_like(holes)
        for x0, x1, y0, y1 in zones:
            allowed[int(h * y0) : int(h * y1), int(w * x0) : int(w * x1)] = True
        holes &= allowed
    arr[holes, 3] = 0
    return Image.fromarray(arr)


# Where a worn garment is really hollow: the neck, and the sleeve ends.
OUTFIT_ZONES = [(0.28, 0.72, 0.0, 0.2), (0.0, 0.3, 0.35, 0.66), (0.7, 1.0, 0.35, 0.66)]
HOLLOW_HEADWEAR = {"hood", "viking-helm", "knight-helm"}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {}
    anchors = {}

    for sheet_name, groups in SHEET_PARTS.items():
        rgb = np.array(Image.open(SHEETS / sheet_name).convert("RGB"))
        rgba = key_out_grey(rgb) if sheet_name == "sheet-b-hair.png" else key_out_magenta(rgb)
        if sheet_name == "sheet-a-bodies.png":
            boxes = split_figures(rgba[..., 3], 5)
        else:
            boxes = find_parts(rgba[..., 3], 0, merge=5 if "gear" in sheet_name else 14)
        names = [(kind, n) for kind, lst in groups for n in lst]
        rows = sum(1 for _ in groups) if sheet_name != "sheet-b-hair.png" else 2
        rows = {"sheet-a-bodies.png": 1, "sheet-b-hair.png": 2, "sheet-c-gear.png": 3}[sheet_name]
        report[sheet_name] = f"found {len(boxes)} of {len(names)}"
        if len(boxes) != len(names):
            print(f"{sheet_name}: found {len(boxes)} parts, expected {len(names)}")
            continue
        for (kind, name), (y0, y1, x0, x1) in zip(names, order_boxes(boxes, rows)):
            pad = 6
            crop = Image.fromarray(
                rgba[max(0, y0 - pad) : y1 + pad, max(0, x0 - pad) : x1 + pad]
            )
            # Trim to what is really drawn.
            bbox = crop.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
            crop = crop.crop(bbox)
            if kind == "body":
                # Keep only this figure, not a neighbour's hand that reaches over.
                pass
            if kind == "outfit":
                crop = clear_dark_holes(crop, OUTFIT_ZONES)
            elif kind == "headwear" and name in HOLLOW_HEADWEAR:
                crop = clear_dark_holes(crop)
            crop.save(OUT / f"{kind}-{name}.png", optimize=True)
            if kind == "body":
                anchors[name] = body_anchors(crop)

    (OUT / "anchors.json").write_text(json.dumps(anchors, indent=2))
    print(json.dumps(report, indent=2))
    print("anchors:", json.dumps(anchors, indent=1)[:600])


if __name__ == "__main__":
    main()
