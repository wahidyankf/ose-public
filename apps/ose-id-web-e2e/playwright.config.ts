import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Pin the tier deterministically for E2E runs — leaving APP_ENV unset would fall back to "local"
// per the tier-loader contract and read a developer's real .env.local instead of test fixtures.
process.env["APP_ENV"] ??= "test";

const WEB_PORT = process.env["OSE_ID_WEB_PORT"] ?? "3500";
const BASE_URL = process.env["WEB_BASE_URL"] ?? `http://127.0.0.1:${WEB_PORT}`;

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/ose/id-web/behaviours",
  features: "../../specs/apps/ose/id-web/behaviours/**/*.feature",
  steps: ["./steps/**/*.steps.ts"],
  tags: "not @e2e-exempt",
});

// A developer running this target directly gets the same deterministic server lifecycle Playwright
// owns in CI. `OSE_RUNTIME_MODE=Test` is the mode the shell's own startup guard admits; the guard
// scenarios spawn their own rejected processes rather than reusing this one.
//
// The fixture serves the built artifact (`start`), never the dev server. Turbopack's dev compiler
// fans out one worker per route segment on first request — measured at 417 node processes here,
// which exhausted memory and swap before the 180s deadline and got the server shed. `start` serves
// the prebuilt `.next` output in ~100ms. `test:e2e` declares the build dependency in project.json.
const webServer = process.env["WEB_BASE_URL"]
  ? undefined
  : {
      command: "npx nx run ose-id-web:start",
      url: BASE_URL,
      reuseExistingServer: !process.env["CI"],
      timeout: 180000,
      cwd: "../..",
      env: {
        APP_ENV: "test",
        OSE_RUNTIME_MODE: "Test",
        OSE_ID_WEB_PORT: WEB_PORT,
      },
    };

export default defineConfig({
  testDir,
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  workers: 1,
  reporter: process.env["CI"] ? [["list"], ["html"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
