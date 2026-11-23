import { describe, it, expect } from "vitest";
import { memorySourceTree, scanWebUi } from "../support/source-tree";

/**
 * Unit binding of the design-system consumption check (decision #26: web-ui, not ts-ui). The real
 * repository is checked by tests/integration/web-ui-consumed.integration.test.ts; here the scan runs
 * over an in-memory double.
 */
describe("web-ui design-system consumption (double)", () => {
  it("counts a component that imports the canonical package as a consumer", () => {
    const tree = memorySourceTree({
      "src/contexts/app-shell/presentation/tab-bar.tsx": 'import { Button } from "@open-sharia-enterprise/web-ui";',
      "src/shared/utils/fmt.ts": 'import { x } from "date-fns";',
    });
    expect(scanWebUi(tree).consumers).toEqual(["src/contexts/app-shell/presentation/tab-bar.tsx"]);
  });

  it("flags a file that names the retired ts-ui alias", () => {
    const tree = memorySourceTree({
      "src/contexts/app-shell/presentation/side-nav.tsx": 'import { Button } from "@open-sharia-enterprise/ts-ui";',
    });
    expect(scanWebUi(tree).aliasOffenders).toEqual(["src/contexts/app-shell/presentation/side-nav.tsx"]);
  });

  it("ignores files outside src and non-source files", () => {
    const tree = memorySourceTree({
      "tests/unit/x.unit.test.ts": 'import { Button } from "@open-sharia-enterprise/ts-ui";',
      "src/styles.css": 'import { Button } from "@open-sharia-enterprise/web-ui";',
    });
    expect(scanWebUi(tree)).toEqual({ consumers: [], aliasOffenders: [] });
  });
});
