import path from "node:path";
import { describe, it, expect } from "vitest";
import { scanWebUi } from "../unit/support/source-tree";
import { nodeSourceTree } from "./support/node-source-tree";

/**
 * Verifies, against the real `src` tree, that organiclever-app-web consumes the shared design system
 * (`@open-sharia-enterprise/web-ui`) from at least one component, and that no file uses the retired
 * `ts-ui` alias (decision #26).
 */
describe("web-ui design-system consumption (real file system)", () => {
  const appRoot = path.resolve(__dirname, "..", "..");
  const scan = scanWebUi(nodeSourceTree(appRoot));

  it("imports @open-sharia-enterprise/web-ui in at least one component", () => {
    expect(scan.consumers.length).toBeGreaterThan(0);
  });

  it("uses only the canonical web-ui package name (never a ts-ui alias)", () => {
    expect(scan.aliasOffenders).toEqual([]);
  });
});
