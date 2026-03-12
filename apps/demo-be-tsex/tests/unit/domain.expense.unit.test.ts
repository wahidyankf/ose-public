import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { validateUnit, isSupportedUnit, SUPPORTED_UNITS } from "../../src/domain/expense.js";

describe("isSupportedUnit", () => {
  it("returns true for liter", () => {
    expect(isSupportedUnit("liter")).toBe(true);
  });

  it("returns true for kilogram", () => {
    expect(isSupportedUnit("kilogram")).toBe(true);
  });

  it("returns true for meter", () => {
    expect(isSupportedUnit("meter")).toBe(true);
  });

  it("returns true for gallon", () => {
    expect(isSupportedUnit("gallon")).toBe(true);
  });

  it("returns true for pound", () => {
    expect(isSupportedUnit("pound")).toBe(true);
  });

  it("returns true for foot", () => {
    expect(isSupportedUnit("foot")).toBe(true);
  });

  it("returns true for mile", () => {
    expect(isSupportedUnit("mile")).toBe(true);
  });

  it("returns true for ounce", () => {
    expect(isSupportedUnit("ounce")).toBe(true);
  });

  it("returns false for unknown unit", () => {
    expect(isSupportedUnit("barrel")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSupportedUnit("")).toBe(false);
  });
});

describe("validateUnit", () => {
  it("accepts a valid unit", () => {
    const result = Effect.runSync(Effect.either(validateUnit("liter")));
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).toBe("liter");
    }
  });

  it("rejects an unsupported unit", () => {
    const result = Effect.runSync(Effect.either(validateUnit("barrel")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.field).toBe("unit");
      expect(result.left.message).toContain("Unsupported unit");
      expect(result.left.message).toContain("barrel");
    }
  });

  it("error message lists supported units", () => {
    const result = Effect.runSync(Effect.either(validateUnit("unknown")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      for (const unit of SUPPORTED_UNITS) {
        expect(result.left.message).toContain(unit);
      }
    }
  });
});

describe("SUPPORTED_UNITS", () => {
  it("contains expected units", () => {
    expect(SUPPORTED_UNITS).toContain("liter");
    expect(SUPPORTED_UNITS).toContain("kilogram");
    expect(SUPPORTED_UNITS).toContain("meter");
  });
});
