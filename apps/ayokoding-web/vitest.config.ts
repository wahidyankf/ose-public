import { defineConfig } from "vitest/config";

// The browser progress module is production code, so it is measured with the
// v8 instrument over the whole file. Coverage counts only the unit test file,
// and every metric must reach 99% (test-and-gate contract C15). An excluded
// file would need a category reason here; none is taken.
export default defineConfig({
  test: {
    environment: "node",
    include: ["assets/js/progress.test.ts", "assets/js/progress.dom.test.ts", "assets/js/copy.dom.test.ts"],
    coverage: {
      provider: "v8",
      include: ["assets/js/progress.ts", "assets/js/copy.ts"],
      all: true,
      reportsDirectory: "coverage/browser",
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 99,
        functions: 99,
        branches: 99,
        statements: 99,
      },
    },
  },
});
