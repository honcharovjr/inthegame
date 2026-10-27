import { describe, expect, it } from "vitest";
import art from "./art.json";
import { DEFAULT_CHARACTER } from "./items";
import { characterScene, fitTransform, tintFactors, viewBox } from "./render";

describe("tintFactors", () => {
  it("scales each channel by the grey of the art", () => {
    expect(tintFactors("#ccaa88", 204)).toEqual([1, 0.833, 0.667]);
  });
});

describe("fitTransform", () => {
  it("scales around the human's eyes and moves to the race's eyes", () => {
    const fit = { hair: { sx: 2, sy: 0.5 }, from: [10, 20], to: [30, 40] };
    expect(fitTransform(fit, "hair")).toBe("translate(30 40) scale(2 0.5) translate(-10 -20)");
  });
});

describe("characterScene", () => {
  it("draws the default human with short hair and no beard", () => {
    const scene = characterScene(DEFAULT_CHARACTER);
    expect(scene.layers.map((l) => l.key)).toEqual(["body", "outfit", "eyes", "hair"]);
    expect(scene.layers[0].href).toBe("/character/human.webp");
    expect(scene.layers[1].href).toBe("/character/outfit-basic-human.webp");
    expect(scene.layers[3].href).toBe("/character/hair-short.webp");
    expect(scene.irises).toHaveLength(2);
  });

  it("puts the beard under the hair and the horns over it", () => {
    const scene = characterScene({ ...DEFAULT_CHARACTER, race: "tiefling", beard: "long" });
    expect(scene.layers.map((l) => l.key)).toEqual(["body", "outfit", "eyes", "beard", "hair", "horns"]);
    expect(scene.layers[5].tint).toEqual(scene.layers[0].tint);
  });

  it("leaves out hair and horns for a bald tiefling, whose horns are part of the body", () => {
    const scene = characterScene({ ...DEFAULT_CHARACTER, race: "tiefling", hair: "none" });
    expect(scene.layers.map((l) => l.key)).toEqual(["body", "outfit", "eyes"]);
  });

  it("fits hair to the head of each race", () => {
    for (const race of Object.keys(art.races)) {
      const hair = characterScene({ ...DEFAULT_CHARACTER, race }).layers.find((l) => l.key === "hair");
      expect(hair.transform).toBe(fitTransform(art.races[race].fit, "hair"));
    }
  });

  it("tints the outfit in the chosen colour", () => {
    const earth = characterScene(DEFAULT_CHARACTER).layers[1].tint;
    const navy = characterScene({ ...DEFAULT_CHARACTER, outfitColor: "navy" }).layers[1].tint;
    expect(navy).not.toEqual(earth);
  });

  it("falls back to the default for a saved blob creature", () => {
    const scene = characterScene({ body: "round", color: "pink" });
    expect(scene.layers[0].href).toBe("/character/human.webp");
  });
});

describe("viewBox", () => {
  it("frames the head as a square and the full figure as the shared box", () => {
    const portrait = viewBox("dwarf", "portrait");
    expect(portrait.w).toBe(portrait.h);
    expect(viewBox("dwarf", "full")).toEqual(art.full);
  });

  it("keeps both eyes inside the portrait of every race", () => {
    for (const [race, data] of Object.entries(art.races)) {
      const box = viewBox(race, "portrait");
      for (const eye of data.eyes) {
        expect(eye.cx).toBeGreaterThan(box.x);
        expect(eye.cx).toBeLessThan(box.x + box.w);
        expect(eye.cy).toBeGreaterThan(box.y);
        expect(eye.cy).toBeLessThan(box.y + box.h);
      }
    }
  });
});
