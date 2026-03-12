import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { validateAmount } from "../../src/domain/expense.js";

describe("validateAmount", () => {
  describe("USD (2 decimal places)", () => {
    it("accepts valid USD amount with 2 decimal places", () => {
      const result = Effect.runSync(Effect.either(validateAmount("USD", 10.99)));
      expect(result._tag).toBe("Right");
    });

    it("accepts valid USD amount with no decimal places", () => {
      const result = Effect.runSync(Effect.either(validateAmount("USD", 10.0)));
      expect(result._tag).toBe("Right");
    });

    it("accepts valid USD amount with 1 decimal place", () => {
      const result = Effect.runSync(Effect.either(validateAmount("USD", 10.5)));
      expect(result._tag).toBe("Right");
    });

    it("rejects USD amount with 3 decimal places", () => {
      const result = Effect.runSync(Effect.either(validateAmount("USD", 10.999)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toContain("2 decimal");
      }
    });
  });

  describe("IDR (0 decimal places)", () => {
    it("accepts valid IDR amount with no decimal places", () => {
      const result = Effect.runSync(Effect.either(validateAmount("IDR", 15000)));
      expect(result._tag).toBe("Right");
    });

    it("rejects IDR amount with decimal places", () => {
      const result = Effect.runSync(Effect.either(validateAmount("IDR", 15000.5)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toContain("0 decimal");
      }
    });
  });

  describe("general validation", () => {
    it("rejects negative amount", () => {
      const result = Effect.runSync(Effect.either(validateAmount("USD", -10)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toContain("negative");
      }
    });

    it("rejects unsupported currency", () => {
      const result = Effect.runSync(Effect.either(validateAmount("EUR", 10.0)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("currency");
        expect(result.left.message).toContain("Unsupported");
      }
    });

    it("accepts zero amount", () => {
      const result = Effect.runSync(Effect.either(validateAmount("USD", 0)));
      expect(result._tag).toBe("Right");
    });

    it("handles case-insensitive currency codes", () => {
      const result = Effect.runSync(Effect.either(validateAmount("usd", 10.99)));
      expect(result._tag).toBe("Right");
    });
  });
});
