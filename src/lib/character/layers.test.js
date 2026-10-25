import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fitPart, figureBox, portraitBox, HEAD_FIT, HELD_FIT, OUTFIT_NECK } from "./layers";

const anchors = JSON.parse(readFileSync("public/character/anchors.json", "utf8"));
const bodies = Object.keys(anchors);

describe("anchors", () => {
  it("has the five bodies with the landmarks the fit needs", () => {
    expect(bodies.sort()).toEqual(["dwarf", "elf", "human-female", "human-male", "orc"]);
    for (const body of bodies) {
      for (const field of ["width", "height", "top", "bottom", "chinY", "headWidth", "jawWidth", "headCenterX", "shoulderLeft", "shoulderRight"]) {
        expect(anchors[body][field], `${body}.${field}`).toBeGreaterThan(-1);
      }
    }
  });
});

describe("fitPart", () => {
  it("puts an outfit from the neck to the feet on every body", () => {
    for (const body of bodies) {
      const a = anchors[body];
      for (const key of Object.keys(OUTFIT_NECK)) {
        const r = fitPart({ key, w: 250, h: 450 }, anchors, body);
        const neckLine = r.y + OUTFIT_NECK[key] * r.h;
        expect(neckLine).toBeGreaterThan(a.chinY - 5);
        expect(neckLine).toBeLessThan(a.chinY + a.height * 0.06);
        expect(r.y + r.h).toBeCloseTo(a.bottom, -1);
        expect(r.x + r.w / 2).toBeCloseTo(a.headCenterX, 0);
      }
    }
  });

  it("centres hair, beards and headwear on the head", () => {
    for (const body of bodies) {
      for (const key of Object.keys(HEAD_FIT)) {
        const r = fitPart({ key, w: 200, h: 150 }, anchors, body);
        expect(r.x + r.w / 2).toBeCloseTo(anchors[body].headCenterX, 0);
        expect(r.w).toBeGreaterThan(0);
      }
    }
  });

  it("keeps a held item beside the body, on the side it is carried", () => {
    const a = anchors["human-male"];
    for (const [key, fit] of Object.entries(HELD_FIT)) {
      const r = fitPart({ key, w: 100, h: 200 }, anchors, "human-male");
      const handX = r.x + fit.ax * r.w;
      if (fit.side === "right") expect(handX).toBeGreaterThan(a.headCenterX);
      else expect(handX).toBeLessThan(a.headCenterX);
    }
  });

  it("scales a nudged part around its own centre", () => {
    const key = "hair-short";
    const base = fitPart({ key, w: 200, h: 150 }, anchors, "human-male");
    const big = fitPart({ key, w: 200, h: 150 }, anchors, "human-male", { scale: 1.5 });
    expect(big.w).toBeCloseTo(base.w * 1.5);
    expect(big.x + big.w / 2).toBeCloseTo(base.x + base.w / 2);
    expect(big.y + big.h / 2).toBeCloseTo(base.y + base.h / 2);
  });

  it("moves a nudged part by a share of the body height", () => {
    const key = "hair-short";
    const base = fitPart({ key, w: 200, h: 150 }, anchors, "elf");
    const moved = fitPart({ key, w: 200, h: 150 }, anchors, "elf", { dy: 0.1 });
    expect(moved.y - base.y).toBeCloseTo(anchors.elf.height * 0.1);
  });
});

describe("boxes", () => {
  it("shows the head in the portrait and the whole body in the figure", () => {
    for (const body of bodies) {
      const a = anchors[body];
      const p = portraitBox(anchors, body);
      expect(p.w).toBe(p.h);
      expect(p.x).toBeLessThan(a.headCenterX);
      expect(p.x + p.w).toBeGreaterThan(a.headCenterX);
      const f = figureBox(anchors, body);
      expect(f.y + f.h).toBeGreaterThanOrEqual(a.bottom);
      expect(f.x).toBeLessThan(0);
    }
  });
});
