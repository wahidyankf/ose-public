import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      reportsDirectory: "coverage/unit",
    },
  },
  resolve: {
    alias: {
      "@open-sharia-enterprise/ayokoding-data": path.resolve(__dirname, "."),
    },
  },
});
