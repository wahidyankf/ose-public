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
        "src/app/layout.tsx",
        "src/app/api/**",
        "src/proxy.ts",
        "src/lib/**",
        "src/test/**",
        "src/services/**",
        "src/layers/**",
        "src/generated-contracts/**",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
      ],
      thresholds: {
        lines: 70,
        functions: 50,
        branches: 60,
        statements: 70,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit",
          include: ["test/unit/**/*.steps.{ts,tsx}", "**/*.unit.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          testTimeout: 15000,
        },
      },
      {
        plugins: sharedPlugins,
        test: {
          name: "integration",
          include: ["test/integration/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          testTimeout: 30000,
        },
      },
    ],
  },
});
