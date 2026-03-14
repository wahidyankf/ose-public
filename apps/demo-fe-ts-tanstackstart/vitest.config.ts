import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const sharedPlugins = [react(), tsconfigPaths()];

export default defineConfig({
  plugins: sharedPlugins,
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      include: ["app/lib/**/*.{ts,tsx}", "app/routes/**/*.tsx", "app/components/**/*.tsx"],
      exclude: ["app/test/**", "app/lib/api/**", "app/lib/auth/**", "app/lib/queries/**", "**/*.{test,spec}.{ts,tsx}"],
      thresholds: {
        lines: 25,
        functions: 10,
        branches: 20,
        statements: 25,
      },
    },
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit",
          include: ["app/test/unit/**/*.steps.{ts,tsx}", "**/*.unit.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules"],
          environment: "jsdom",
          setupFiles: ["./app/test/setup.ts"],
        },
        resolve: {
          alias: {
            "~": path.resolve(__dirname, "app"),
          },
        },
      },
    ],
  },
});
