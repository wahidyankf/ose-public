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
      exclude: [
        "src/app/layout.tsx",
        "src/app/head.tsx",
        "src/app/data.ts",
        "src/app/fonts/**",
        "src/app/**/*.css",
        "src/test/**",
        "**/*.config.*",
        "**/.next/**",
        "**/dist/**",
        "**/coverage/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      reporter: ["text", "json-summary", "lcov"],
    },
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit-fe",
          exclude: ["node_modules"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        plugins: sharedPlugins,
        test: {
          name: "integration",
          exclude: ["node_modules"],
          environment: "node",
        },
      },
    ],
  },
});
