import { describe, expect, it } from "vitest";
import { linePath, sharedPaths } from "./chart";

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
