import { afterEach, describe, it, expect } from "vitest";
import { formatRelativeTime } from "../../../../src/shared/utils/format-relative-time";
import { FIXED_MS, freezeClock, restoreClock } from "../../support/doubles";

const now = new Date("2024-01-15T12:00:00.000Z");

afterEach(() => restoreClock());

describe("formatRelativeTime", () => {
  it("returns 'just now' for less than 60 seconds ago", () => {
    const iso = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(iso, now)).toBe("just now");
  });

  it("returns 'just now' for 0 seconds ago", () => {
    const iso = now.toISOString();
    expect(formatRelativeTime(iso, now)).toBe("just now");
  });

  it("returns minutes for 1-59 minutes ago", () => {
    const iso30m = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso30m, now)).toBe("30m ago");

    const iso1m = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(formatRelativeTime(iso1m, now)).toBe("1m ago");

    const iso59m = new Date(now.getTime() - 59 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso59m, now)).toBe("59m ago");
  });

  it("returns hours for 1-23 hours ago", () => {
    const iso1h = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso1h, now)).toBe("1h ago");

    const iso12h = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso12h, now)).toBe("12h ago");

    const iso23h = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso23h, now)).toBe("23h ago");
  });

  it("returns days for 1-6 days ago", () => {
    const iso1d = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso1d, now)).toBe("1d ago");

    const iso6d = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso6d, now)).toBe("6d ago");
  });

  it("returns ISO date string for 7+ days ago", () => {
    const iso7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso7d, now)).toBe("2024-01-08");

    const iso30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso30d, now)).toBe("2023-12-16");
  });

  it("uses current date when now is not provided", () => {
    freezeClock();
    const recentIso = new Date(FIXED_MS - 5000).toISOString();
    expect(formatRelativeTime(recentIso)).toBe("just now");
  });
});
