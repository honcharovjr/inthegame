import { describe, expect, it } from "vitest";
import { SESSION_STEPS, milestone } from "./milestones";

describe("milestone", () => {
  it("aims at the next step above the value", () => {
    expect(milestone(0, SESSION_STEPS)).toEqual({ target: 1, share: 0 });
    expect(milestone(10, SESSION_STEPS)).toEqual({ target: 50, share: 0.2 });
    expect(milestone(96, SESSION_STEPS)).toEqual({ target: 100, share: 0.96 });
  });

  it("stays full past the last step", () => {
    expect(milestone(140, SESSION_STEPS)).toEqual({ target: 100, share: 1 });
  });
});
