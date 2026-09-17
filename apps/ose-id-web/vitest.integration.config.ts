import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * The Integration adapter drives the real Next.js server-side boundary of this app — the config
 * entry that guards startup, the environment modules it loads, and the proxy/page composition
 * that answers a request — in a Node environment with controlled configuration and no network.
 *
 * Its coverage denominator is exactly the five boundary files the Unit adapter cannot reach, so
 * every authored line of this app is measured by one adapter or the other.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
      provider: "v8",
      include: [
        "src/env.ts",
        "src/env-loader.ts",
        "src/proxy.ts",
        "src/app/page.tsx",
        "src/contexts/foundation/application/status-middleware.ts",
      ],
      reporter: ["text", "json-summary", "lcov"],
    },
    include: ["tests/integration/**/*.test.{ts,tsx}", "tests/integration/**/*Steps.{ts,tsx}"],
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
