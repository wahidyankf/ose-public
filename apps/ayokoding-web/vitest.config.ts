import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["assets/js/progress.test.ts"],
  },
});
