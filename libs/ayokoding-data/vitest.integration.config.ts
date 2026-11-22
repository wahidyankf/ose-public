import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@open-sharia-enterprise/ayokoding-data": path.resolve(__dirname, "src"),
    },
  },
});
