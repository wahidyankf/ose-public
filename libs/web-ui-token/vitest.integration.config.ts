import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@open-sharia-enterprise/web-ui-token": path.resolve(__dirname, "src"),
    },
  },
});
