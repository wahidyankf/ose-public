import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/demo/fe/gherkin",
  features: "../../specs/apps/demo/fe/gherkin/**/*.feature",
  steps: ["./tests/steps/**/*.steps.ts", "./tests/hooks/**/*.ts"],
});

export default defineConfig({
  testDir,
  timeout: 60000,
  // Each scenario resets the shared database before running, so tests must
  // run sequentially within a single machine to avoid DB state conflicts.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3301",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
