import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/demo/be/gherkin",
  features: "../../specs/apps/demo/be/gherkin/**/*.feature",
  steps: ["./tests/steps/**/*.ts", "./tests/hooks/**/*.ts"],
});

export default defineConfig({
  testDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8201",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
