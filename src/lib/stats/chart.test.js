import { describe, expect, it } from "vitest";
import { chartScale, linePath, sharedPaths } from "./chart";

describe("linePath", () => {
  it("spreads points across the width and fits the height", () => {
    expect(linePath([0, 10, 5], 100, 50, 0)).toBe("M0 50 L50 0 L100 25");
  });

  it("draws one value as a flat line through the middle", () => {
    expect(linePath([1500], 100, 40)).toBe("M0 20 L100 20");
  });

  it("is empty without values", () => {
    expect(linePath([], 100, 40)).toBe("");
  });
});

describe("sharedPaths", () => {
  it("puts every series on one scale", () => {
    const [low, high] = sharedPaths([{ values: [0, 0] }, { values: [10, 10] }], 10, 10, 0);
    expect(low).toBe("M0 10 L10 10");
    expect(high).toBe("M0 0 L10 0");
  });
});

describe("chartScale", () => {
  it("gives the range of all series and where a value sits", () => {
    const scale = chartScale([{ values: [1000, 1100] }, { values: [1200] }], 100, 10);
    expect(scale.min).toBe(1000);
    expect(scale.max).toBe(1200);
    expect(scale.y(1200)).toBe(10);
    expect(scale.y(1000)).toBe(90);
    expect(scale.y(1100)).toBe(50);
  });

  it("puts equal values in the middle", () => {
    expect(chartScale([{ values: [5, 5] }], 40).y(5)).toBe(20);
  });
});
