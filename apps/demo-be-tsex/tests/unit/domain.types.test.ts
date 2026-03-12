import { describe, it, expect } from "vitest";
import {
  isSupportedCurrency,
  isRole,
  isUserStatus,
  SUPPORTED_CURRENCIES,
  ROLES,
  USER_STATUSES,
  CURRENCY_DECIMALS,
} from "../../src/domain/types.js";

describe("isSupportedCurrency", () => {
  it("returns true for USD", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
  });

  it("returns true for IDR", () => {
    expect(isSupportedCurrency("IDR")).toBe(true);
  });

  it("returns false for EUR", () => {
    expect(isSupportedCurrency("EUR")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSupportedCurrency("")).toBe(false);
  });

  it("returns false for lowercase usd", () => {
    expect(isSupportedCurrency("usd")).toBe(false);
  });
});

describe("isRole", () => {
  it("returns true for USER", () => {
    expect(isRole("USER")).toBe(true);
  });

  it("returns true for ADMIN", () => {
    expect(isRole("ADMIN")).toBe(true);
  });

  it("returns false for SUPERADMIN", () => {
    expect(isRole("SUPERADMIN")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isRole("")).toBe(false);
  });
});

describe("isUserStatus", () => {
  it("returns true for ACTIVE", () => {
    expect(isUserStatus("ACTIVE")).toBe(true);
  });

  it("returns true for INACTIVE", () => {
    expect(isUserStatus("INACTIVE")).toBe(true);
  });

  it("returns true for DISABLED", () => {
    expect(isUserStatus("DISABLED")).toBe(true);
  });

  it("returns true for LOCKED", () => {
    expect(isUserStatus("LOCKED")).toBe(true);
  });

  it("returns false for SUSPENDED", () => {
    expect(isUserStatus("SUSPENDED")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isUserStatus("")).toBe(false);
  });
});

describe("constants", () => {
  it("SUPPORTED_CURRENCIES contains USD and IDR", () => {
    expect(SUPPORTED_CURRENCIES).toContain("USD");
    expect(SUPPORTED_CURRENCIES).toContain("IDR");
  });

  it("ROLES contains USER and ADMIN", () => {
    expect(ROLES).toContain("USER");
    expect(ROLES).toContain("ADMIN");
  });

  it("USER_STATUSES contains all expected statuses", () => {
    expect(USER_STATUSES).toContain("ACTIVE");
    expect(USER_STATUSES).toContain("INACTIVE");
    expect(USER_STATUSES).toContain("DISABLED");
    expect(USER_STATUSES).toContain("LOCKED");
  });

  it("CURRENCY_DECIMALS has correct precision for USD", () => {
    expect(CURRENCY_DECIMALS["USD"]).toBe(2);
  });

  it("CURRENCY_DECIMALS has correct precision for IDR", () => {
    expect(CURRENCY_DECIMALS["IDR"]).toBe(0);
  });
});
