"""Draws the layout stencil for the character template.

The stencil is a flat silhouette on the same canvas as every layer
(1024 x 1536). It is uploaded to the image tool, so the head, shoulders and
arms of every base character land in the same place. Magenta is the
background, light grey the body, green the placeholder below the waist.

Run with a Python that has pillow:
    python3 scripts/make_layout_guide.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

W, H, SCALE = 1024, 1536, 2
CX = 512
MAGENTA, GREY, GREEN = (255, 0, 255), (190, 190, 190), (0, 255, 0)

# Key positions, in pixels. Everything else is drawn from these.
HEAD_TOP, CHIN = 130, 490  # head about 23% of the canvas height
SHOULDER_Y, WAIST_Y = 600, 1130
ARM_OUTER = 190  # outer edge of the arms: a clear margin for capes and pauldrons


def mirror(points):
    return [(2 * CX - x, y) for x, y in points]


def main():
    img = Image.new("RGB", (W * SCALE, H * SCALE), MAGENTA)
    d = ImageDraw.Draw(img)

    def poly(points, fill):
        d.polygon([(x * SCALE, y * SCALE) for x, y in points], fill=fill)

    def ellipse(cx, cy, rx, ry, fill):
        d.ellipse([(cx - rx) * SCALE, (cy - ry) * SCALE, (cx + rx) * SCALE, (cy + ry) * SCALE], fill=fill)

    # Placeholder for clothing: hips and thighs.
    poly([(350, WAIST_Y), (674, WAIST_Y), (708, H), (316, H)], GREEN)

    # Arms hang close to the body, a small gap at the waist.
    arm = [(ARM_OUTER + 25, 640), (340, 600), (322, 900), (312, 1170), (205, 1170), (ARM_OUTER, 900)]
    poly(arm, GREY)
    poly(mirror(arm), GREY)
    ellipse(262, 650, 78, 82, GREY)
    ellipse(2 * CX - 262, 650, 78, 82, GREY)
    ellipse(258, 1215, 56, 78, GREY)
    ellipse(2 * CX - 258, 1215, 56, 78, GREY)

    # Torso, neck and head.
    torso = [(330, 600), (694, 600), (668, 900), (650, WAIST_Y), (374, WAIST_Y), (356, 900)]
    poly(torso, GREY)
    poly([(442, 470), (582, 470), (596, 570), (428, 570)], GREY)
    poly([(428, 560), (596, 560), (694, 612), (330, 612)], GREY)
    ellipse(CX, 310, 130, 180, GREY)
    d.rounded_rectangle([(CX - 78) * SCALE, 400 * SCALE, (CX + 78) * SCALE, CHIN * SCALE], radius=40 * SCALE, fill=GREY)
    for s in (-1, 1):
        ellipse(CX + s * 138, 320, 20, 42, GREY)

    out = Path(__file__).resolve().parent.parent / "art" / "character-templates" / "layout-guide.png"
    img.resize((W, H), Image.LANCZOS).save(out, optimize=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
