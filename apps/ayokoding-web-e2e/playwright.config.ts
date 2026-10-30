import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const workspaceRoot = path.resolve(__dirname, "../..");

// The Go server owns port 3191 for the acceptance suite. The binary under
// test is built by `ayokoding-web-e2e:test:e2e` before Playwright starts, and
// it serves the parity fixture corpus (AYOKODING_WEB_FIXTURE=parity), the same
// canned content the godog unit and integration drivers bind. Reusing an
// existing server would let a stale build mask fixture drift, so Playwright
// always owns this lifecycle.
// Bddgen generates the canonical-corpus specs below the project root; the
// focused ordinary specs in tests/e2e/*.spec.ts run under the companion
// playwright.focused.config.ts because the BDD runtime resolves its config
// from the generated test directory.
const testDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: [path.join(workspaceRoot, "specs/apps/ayokoding/web/behaviours/**/*.feature")],
  steps: "./tests/e2e/steps/**/*.steps.ts",
  tags: "not @e2e-exempt",
});

export default defineConfig({
  testDir,
  timeout: 60000,
  // One worker: progress, storage, and port-stub scenarios share origin
  // state and loopback listeners, so they must not overlap.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Zero retries everywhere: a failure is evidence, never flake to absorb.
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    baseURL: "http://localhost:3191",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "apps/ayokoding-web/dist/ayokoding-web",
    url: "http://localhost:3191/en",
    reuseExistingServer: false,
    timeout: 120000,
    cwd: workspaceRoot,
    env: {
      AYOKODING_WEB_PORT: "3191",
      AYOKODING_WEB_FIXTURE: "parity",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
