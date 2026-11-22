import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Generated output (category G): OpenAPI client code, written by the codegen target.
        "src/generated-contracts/**",
        // Non-production code (category N): test setup, test files, and stories. Reasons also in the project README.
        "src/test/**",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
      ],
      thresholds: {
        // Only line coverage is a repository-enforced floor (AC-COVERAGE-01);
        // the `test:unit` Nx target's `--coverage.thresholds.lines=99`
        // flag is the source of truth and overrides this value at
        // invocation time. Functions/branches/statements keep their
        // pre-migration bar — raising them isn't part of this contract.
        lines: 99,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    // This project has no isolated local-resource boundary, so it owns no Integration runtime.
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/unit/**/*.steps.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
