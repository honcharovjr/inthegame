import { describe, expect, it } from "vitest";
import { findAchievement } from "../achievements/catalog";
import {
  ACCESSORIES,
  BACKGROUNDS,
  DEFAULT_CHARACTER,
  nameStyle,
  resolveCharacter,
  validateCharacter,
} from "./items";

const none = new Set();

describe("items", () => {
  it("has 10 accessories, 8 free backgrounds and 4 earned ones", () => {
    expect(ACCESSORIES).toHaveLength(10);
    expect(BACKGROUNDS.filter((b) => !b.unlockedBy)).toHaveLength(8);
    expect(BACKGROUNDS.filter((b) => b.unlockedBy)).toHaveLength(4);
  });

  it("unlocks every item with a real achievement, one accessory each", () => {
    for (const item of [...ACCESSORIES, ...BACKGROUNDS.filter((b) => b.unlockedBy)]) {
      expect(findAchievement(item.unlockedBy), item.code).not.toBeNull();
    }
    const codes = ACCESSORIES.map((a) => a.unlockedBy);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("validateCharacter", () => {
  it("accepts the default character", () => {
    expect(validateCharacter(DEFAULT_CHARACTER, none)).toEqual({
      character: DEFAULT_CHARACTER,
    });
  });

  it("rejects an unknown part", () => {
    expect(validateCharacter({ ...DEFAULT_CHARACTER, eyeColor: "laser" }, none).error).toBeTruthy();
    expect(validateCharacter({ ...DEFAULT_CHARACTER, race: "goblin" }, none).error).toBeTruthy();
  });

  it("rejects a locked accessory and accepts it once earned", () => {
    const wanted = { ...DEFAULT_CHARACTER, accessory: "party-hat" };
    expect(validateCharacter(wanted, none).error).toMatch(/locked/);
    expect(validateCharacter(wanted, new Set(["regular"])).character.accessory).toBe("party-hat");
  });

  it("rejects a locked background", () => {
    const wanted = { ...DEFAULT_CHARACTER, background: "stars" };
    expect(validateCharacter(wanted, none).error).toMatch(/locked/);
    expect(validateCharacter(wanted, new Set(["centurion"])).character.background).toBe("stars");
  });

  it("lets a player wear only an earned badge", () => {
    const wanted = { ...DEFAULT_CHARACTER, badge: "first-win" };
    expect(validateCharacter(wanted, none).error).toBeTruthy();
    expect(validateCharacter(wanted, new Set(["first-win"])).character.badge).toBe("first-win");
  });
});

describe("resolveCharacter", () => {
  it("falls back to defaults for null and unknown codes", () => {
    expect(resolveCharacter(null)).toEqual(DEFAULT_CHARACTER);
    expect(resolveCharacter({ race: "goblin", accessory: "jetpack" })).toEqual(DEFAULT_CHARACTER);
  });

  it("turns a saved blob creature into the default character, keeping what still exists", () => {
    const blob = { body: "round", color: "pink", eyes: "dots", mouth: "smile", background: "stars", accessory: "cape", badge: "first-win" };
    expect(resolveCharacter(blob)).toEqual({ ...DEFAULT_CHARACTER, background: "stars", accessory: "cape", badge: "first-win" });
  });
});

describe("nameStyle", () => {
  it("styles the name from the accessory", () => {
    expect(nameStyle({ accessory: "captain-hat" })).toBe("name-gradient");
    expect(nameStyle({ accessory: "monocle" })).toBe("name-gold");
    expect(nameStyle({ accessory: "cape" })).toBe("");
    expect(nameStyle(null)).toBe("");
  });
});
