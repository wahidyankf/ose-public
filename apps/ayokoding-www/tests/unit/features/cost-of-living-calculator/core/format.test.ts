import { describe, expect, it } from "vitest";

import { fmtDualCurrency, healthcareBadgeHue } from "../../../../../src/features/cost-of-living-calculator/core/format";

describe("fmtDualCurrency", () => {
  it("formats local currency amount and USD equivalent separated by slash", () => {
    expect(fmtDualCurrency(3500, "SGD", 2250)).toBe("SGD 3,500 / $2,250");
  });

  it("formats JPY and USD", () => {
    expect(fmtDualCurrency(500000, "JPY", 3300)).toBe("JPY 500,000 / $3,300");
  });

  it("formats zero amounts", () => {
    expect(fmtDualCurrency(0, "EUR", 0)).toBe("EUR 0 / $0");
  });

  it("rounds fractional amounts to nearest integer", () => {
    expect(fmtDualCurrency(1000.7, "IDR", 0.06)).toBe("IDR 1,001 / $0");
  });
});

describe("healthcareBadgeHue", () => {
  it("maps tax-funded care to sage (fully covered)", () => {
    expect(healthcareBadgeHue("tax-funded")).toBe("sage");
  });

  it("maps mandatory payroll insurance to honey (partly covered)", () => {
    expect(healthcareBadgeHue("mixed")).toBe("honey");
  });

  it("maps out-of-pocket care to terracotta (you pay it yourself)", () => {
    expect(healthcareBadgeHue("oop")).toBe("terracotta");
  });
});
