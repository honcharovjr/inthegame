import { describe, expect, it } from "vitest";
import { activityCalendar } from "./activity";

// Thursday, 29 October 2026
const TODAY = "2026-10-29T15:00:00Z";

describe("activityCalendar", () => {
  it("has a column of 7 days per week, starting on a Monday", () => {
    const { cells } = activityCalendar([], TODAY, 4);
    expect(cells).toHaveLength(28);
    expect(cells[0].date).toBe("2026-10-05");
    expect(new Date(`${cells[0].date}T00:00:00Z`).getUTCDay()).toBe(1);
  });

  it("counts sessions per day and caps the level at 4", () => {
    const dates = ["2026-10-27T10:00:00Z", "2026-10-27T20:00:00Z", ...Array(6).fill("2026-10-28T12:00:00Z")];
    const { cells } = activityCalendar(dates, TODAY, 1);
    const byDate = Object.fromEntries(cells.map((c) => [c.date, c]));
    expect(byDate["2026-10-27"]).toMatchObject({ count: 2, level: 2 });
    expect(byDate["2026-10-28"]).toMatchObject({ count: 6, level: 4 });
    expect(byDate["2026-10-26"].level).toBe(0);
  });

  it("marks the days after today", () => {
    const { cells } = activityCalendar([], TODAY, 1);
    expect(cells.map((c) => c.level)).toEqual([0, 0, 0, 0, -1, -1, -1]);
  });

  it("labels the first week of each month", () => {
    const { months } = activityCalendar([], TODAY, 9);
    expect(months.map((m) => m.label)).toEqual(["aug", "sep", "oct"]);
    expect(months[0].column).toBe(0);
  });
});
