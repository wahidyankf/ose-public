import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Integration tier: adapters exercised against real loopback resources (local HTTP servers).
// The unit config (vitest.config.ts) excludes this directory.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 15000,
  },
});
