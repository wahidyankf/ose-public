import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // The enumerated server-boundary files. Each one is measured instead by the Integration
        // adapter (`vitest.integration.config.ts`) or, for the framework document shell, by the
        // `ose-id-web-e2e` browser adapter. No broad glob and no mixed-logic file is excluded.
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/env.ts",
        "src/contexts/foundation/application/status-middleware.ts",
        "src/env-loader.ts",
        "src/proxy.ts",
        "src/test/**",
        "**/*.{test,spec}.{ts,tsx}",
      ],
      thresholds: {
        lines: 99,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/unit/**/*Steps.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
