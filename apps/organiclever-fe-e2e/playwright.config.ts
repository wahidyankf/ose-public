import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/organiclever/fe/gherkin",
  features: "../../specs/apps/organiclever/fe/gherkin/**/*.feature",
  steps: ["./steps/**/*.steps.ts"],
});

export default defineConfig({
  testDir,
  timeout: 60000,
  // Tests run sequentially to avoid auth state conflicts across scenarios.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3200",
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
