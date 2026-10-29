import { describe, expect, it } from "vitest";
import { nextUnlock } from "./next";

describe("nextUnlock", () => {
  it("picks the locked item whose achievement is closest to done", () => {
    const results = [
      { code: "marathon", earned: false, current: 4, target: 5 },
      { code: "centurion", earned: false, current: 96, target: 100 },
      { code: "explorer", earned: false, current: 1, target: 5 },
    ];
    expect(nextUnlock(results)).toEqual({
      item: "Stars",
      achievement: "Centurion",
      current: 96,
      target: 100,
    });
  });

  it("skips items already earned", () => {
    const results = [
      { code: "centurion", earned: true, current: 100, target: 100 },
      { code: "marathon", earned: false, current: 2, target: 5 },
    ];
    expect(nextUnlock(results)).toMatchObject({ item: "Headphones", current: 2 });
  });

  it("is null when nothing is left to unlock", () => {
    expect(nextUnlock([])).toBeNull();
  });
});
