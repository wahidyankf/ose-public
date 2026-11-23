import path from "node:path";
import { describe, it, expect } from "vitest";
import { landingRemnants } from "../unit/support/source-tree";
import { nodeSourceTree } from "./support/node-source-tree";

/**
 * Regression guard for the organiclever web split (Phase 6), checked against the real repository.
 * The marketing `landing` experience moved to the dedicated `organiclever-www` site, so the app
 * client must carry no `landing` context and no landing steps.
 */
describe("landing context removal (real file system)", () => {
  const appRoot = path.resolve(__dirname, "..", "..");

  it("has no src/contexts/landing directory and no landing unit-test steps directory", () => {
    expect(landingRemnants(nodeSourceTree(appRoot))).toEqual([]);
  });
});
