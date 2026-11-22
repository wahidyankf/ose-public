import { describe, it, expect } from "vitest";
import { landingRemnants, memorySourceTree } from "../support/source-tree";

/**
 * Unit binding of the landing-removal regression guard (Phase 6). The real repository is checked
 * by tests/integration/landing-removed.integration.test.ts; here the scan runs over an in-memory double.
 */
describe("landing context removal (double)", () => {
  it("reports nothing when no landing context or steps remain", () => {
    const tree = memorySourceTree({ "src/contexts/app-shell/domain/index.ts": "" });
    expect(landingRemnants(tree)).toEqual([]);
  });

  it("reports a landing context left in src", () => {
    const tree = memorySourceTree({ "src/contexts/landing/domain/index.ts": "" });
    expect(landingRemnants(tree)).toEqual(["src/contexts/landing"]);
  });

  it("reports a landing unit-test steps directory", () => {
    const tree = memorySourceTree({ "tests/unit/steps/landing/landing.steps.tsx": "" });
    expect(landingRemnants(tree)).toEqual(["tests/unit/steps/landing"]);
  });
});
