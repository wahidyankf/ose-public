import { afterEach, beforeEach, describe, it, expect } from "vitest";
import {
  parseWeight,
  brzycki1RM,
  toNumber,
  toDateStr,
  computeStreak,
} from "../../../../../src/contexts/stats/domain/types";
import { FIXED_INSTANT, FIXED_MS, freezeClock, restoreClock } from "../../../support/doubles";

beforeEach(() => freezeClock());
afterEach(() => restoreClock());

describe("parseWeight", () => {
  it("returns 0 for null, undefined, and empty string", () => {
    expect(parseWeight(null)).toBe(0);
    expect(parseWeight(undefined)).toBe(0);
    expect(parseWeight("")).toBe(0);
  });

  it("parses a leading numeric prefix", () => {
    expect(parseWeight("60kg")).toBe(60);
    expect(parseWeight("45.5 lb")).toBe(45.5);
  });

  it("returns 0 for non-numeric input", () => {
    expect(parseWeight("bodyweight")).toBe(0);
  });
});

describe("brzycki1RM", () => {
  it("returns null outside the 1-10 rep range", () => {
    expect(brzycki1RM(100, 0)).toBeNull();
    expect(brzycki1RM(100, 11)).toBeNull();
  });

  it("returns the raw weight for a single rep", () => {
    expect(brzycki1RM(100, 1)).toBe(100);
  });

  it("computes the Brzycki estimate for reps in range", () => {
    const rm = brzycki1RM(100, 5);
    expect(rm).toBeCloseTo(100 * (36 / 32), 5);
  });
});

describe("toNumber", () => {
  it("returns 0 for null/undefined", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it("converts bigint to number", () => {
    expect(toNumber(BigInt(42))).toBe(42);
  });

  it("parses numeric strings and falls back to 0 for unparseable ones", () => {
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber("not-a-number")).toBe(0);
  });

  it("passes through plain numbers", () => {
    expect(toNumber(7)).toBe(7);
  });
});

describe("toDateStr", () => {
  it("defaults to today's date when null", () => {
    const result = toDateStr(null);
    const today = FIXED_INSTANT.slice(0, 10);
    expect(result).toBe(today);
  });

  it("formats a Date instance", () => {
    const d = new Date("2024-03-15T12:00:00.000Z");
    expect(toDateStr(d)).toBe("2024-03-15");
  });

  it("formats a plain string via the toString/slice fallback", () => {
    expect(toDateStr("2024-03-15T08:00:00Z")).toBe("2024-03-15");
  });
});

describe("computeStreak", () => {
  it("returns 0 for an empty row list", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("returns 0 when no week has 2+ workouts", () => {
    expect(computeStreak([{ week_start: "2024-01-01", workout_count: 1 }])).toBe(0);
  });

  function currentMondayWeekStart(): Date {
    const now = new Date(FIXED_MS);
    const dayOfWeek = now.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - daysSinceMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  it("counts the current week as a 1-week streak when it qualifies", () => {
    const weekStart = currentMondayWeekStart();
    const rows = [{ week_start: weekStart.toISOString().slice(0, 10), workout_count: 3 }];
    expect(computeStreak(rows)).toBe(1);
  });

  it("counts consecutive qualifying weeks ending at the current week", () => {
    const weekStart = currentMondayWeekStart();
    const oneWeekAgo = new Date(weekStart);
    oneWeekAgo.setDate(weekStart.getDate() - 7);
    const twoWeeksAgo = new Date(weekStart);
    twoWeeksAgo.setDate(weekStart.getDate() - 14);

    const rows = [
      { week_start: weekStart.toISOString().slice(0, 10), workout_count: 2 },
      { week_start: oneWeekAgo.toISOString().slice(0, 10), workout_count: 4 },
      { week_start: twoWeeksAgo.toISOString().slice(0, 10), workout_count: 2 },
    ];
    expect(computeStreak(rows)).toBe(3);
  });

  it("stops the streak at the first non-qualifying week", () => {
    const weekStart = currentMondayWeekStart();
    const twoWeeksAgo = new Date(weekStart);
    twoWeeksAgo.setDate(weekStart.getDate() - 14);

    // one week ago is missing entirely — breaks the chain even though the
    // week before that qualifies.
    const rows = [
      { week_start: weekStart.toISOString().slice(0, 10), workout_count: 2 },
      { week_start: twoWeeksAgo.toISOString().slice(0, 10), workout_count: 5 },
    ];
    expect(computeStreak(rows)).toBe(1);
  });
});
