import { describe, it, expect } from "vitest";
import { healthRouter } from "../../src/routes/health.js";

describe("healthRouter", () => {
  it("is defined", () => {
    expect(healthRouter).toBeDefined();
  });

  it("is an object (HttpApp)", () => {
    expect(typeof healthRouter).toBe("object");
  });
});
