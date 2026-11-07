import { describe, expect, it } from "vitest";
import { linkTarget } from "./next";

const ORIGIN = "https://inthegame.app";

describe("linkTarget", () => {
  it("keeps a full address on this site as a path", () => {
    expect(linkTarget("https://inthegame.app/join/abc", ORIGIN)).toBe("/join/abc");
    expect(linkTarget("https://inthegame.app/reset-password", ORIGIN)).toBe("/reset-password");
  });

  it("keeps a path with its query", () => {
    expect(linkTarget("/app/teams?x=1", ORIGIN)).toBe("/app/teams?x=1");
  });

  it("sends the bare site address and empty values to Home", () => {
    expect(linkTarget("https://inthegame.app", ORIGIN)).toBe("/app");
    expect(linkTarget("", ORIGIN)).toBe("/app");
    expect(linkTarget(null, ORIGIN)).toBe("/app");
  });

  it("refuses other sites", () => {
    expect(linkTarget("https://evil.example/app", ORIGIN)).toBe("/app");
    expect(linkTarget("//evil.example/app", ORIGIN)).toBe("/app");
  });
});
