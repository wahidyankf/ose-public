import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const sharedPlugins = [react(), tsconfigPaths()];

export default defineConfig({
  plugins: sharedPlugins,
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/ui/**",
        "src/app/api/**",
        "src/app/layout.tsx",
        "src/app/metadata.ts",
        "src/contexts/**",
        "src/test/**",
        "**/*.stories.*",
        "**/*.{test,spec}.{ts,tsx}",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit",
          include: ["**/*.unit.{test,spec}.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
          exclude: ["**/*.integration.{test,spec}.{ts,tsx}", "node_modules"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        plugins: sharedPlugins,
        test: {
          name: "integration",
          include: ["**/*.integration.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          testTimeout: 30000,
        },
      },
    ],
  },
});
