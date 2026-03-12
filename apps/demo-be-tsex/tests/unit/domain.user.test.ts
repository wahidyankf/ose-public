import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { validatePasswordStrength, validateEmailFormat, validateUsername } from "../../src/domain/user.js";

describe("validatePasswordStrength", () => {
  it("accepts a valid strong password", () => {
    const result = Effect.runSync(Effect.either(validatePasswordStrength("StrongPass123!")));
    expect(result._tag).toBe("Right");
  });

  it("rejects a password shorter than 12 characters", () => {
    const result = Effect.runSync(Effect.either(validatePasswordStrength("Short1!")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.field).toBe("password");
      expect(result.left.message).toContain("12");
    }
  });

  it("rejects a password without uppercase letters", () => {
    const result = Effect.runSync(Effect.either(validatePasswordStrength("nouppercase123!")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.field).toBe("password");
      expect(result.left.message).toContain("uppercase");
    }
  });

  it("rejects a password without special characters", () => {
    const result = Effect.runSync(Effect.either(validatePasswordStrength("NoSpecialChar123")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.field).toBe("password");
      expect(result.left.message).toContain("special");
    }
  });

  it("accepts a password with exactly 12 characters meeting all requirements", () => {
    const result = Effect.runSync(Effect.either(validatePasswordStrength("Password123!!")));
    expect(result._tag).toBe("Right");
  });
});

describe("validateEmailFormat", () => {
  it("accepts a valid email address", () => {
    const result = Effect.runSync(Effect.either(validateEmailFormat("user@example.com")));
    expect(result._tag).toBe("Right");
  });

  it("rejects an email without @ symbol", () => {
    const result = Effect.runSync(Effect.either(validateEmailFormat("invalidemail.com")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.field).toBe("email");
    }
  });

  it("rejects an email without domain", () => {
    const result = Effect.runSync(Effect.either(validateEmailFormat("user@")));
    expect(result._tag).toBe("Left");
  });

  it("accepts an email with subdomain", () => {
    const result = Effect.runSync(Effect.either(validateEmailFormat("user@mail.example.com")));
    expect(result._tag).toBe("Right");
  });
});

describe("validateUsername", () => {
  it("accepts a valid username", () => {
    const result = Effect.runSync(Effect.either(validateUsername("john_doe")));
    expect(result._tag).toBe("Right");
  });

  it("accepts a username with hyphens", () => {
    const result = Effect.runSync(Effect.either(validateUsername("john-doe")));
    expect(result._tag).toBe("Right");
  });

  it("rejects a username shorter than 3 characters", () => {
    const result = Effect.runSync(Effect.either(validateUsername("ab")));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.field).toBe("username");
    }
  });

  it("rejects a username with special characters", () => {
    const result = Effect.runSync(Effect.either(validateUsername("user@name")));
    expect(result._tag).toBe("Left");
  });

  it("rejects a username longer than 50 characters", () => {
    const long = "a".repeat(51);
    const result = Effect.runSync(Effect.either(validateUsername(long)));
    expect(result._tag).toBe("Left");
  });
});
