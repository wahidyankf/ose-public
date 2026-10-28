import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Pin the tier deterministically for e2e runs — leaving APP_ENV unset would fall back to
// "local" per the loader contract in plans/in-progress/restrict-env-access-to-prod-and-stag,
// which would read a developer's real .env.local instead of test fixtures.
process.env.APP_ENV ??= "test";

const workspaceRoot = path.resolve(__dirname, "../..");

const testDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: [
    path.join(workspaceRoot, "specs/apps/ayokoding/www/behaviours/frontend/**/*.feature"),
    // The backend API features exercise the same live server through Playwright's request fixture.
    path.join(workspaceRoot, "specs/apps/ayokoding/www/behaviours/backend/**/*.feature"),
  ],
  steps: "./tests/e2e/steps/**/*.steps.ts",
  tags: "not @e2e-exempt",
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Default (30s) is too tight for the handful of scenarios that fan out several
  // `page.request.get()` calls (with `getResilient`'s single-retry, and per-request timeouts up
  // to 30s) against the single local production server instance under full-suite parallel load —
  // see `src/support/resilient-request.ts`. It also has to accommodate the `expect.poll` calls in
  // `cost-of-living-calculator.steps.ts` (up to 60s each) that wait out a lagging React re-render
  // under the same contention. 150s gives that combined class of scenario room to retry without
  // hitting the test's own deadline first.
  timeout: 150000,
  reporter: [["list"], ["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3101",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "cp -r apps/ayokoding-www/.next/static apps/ayokoding-www/.next/standalone/apps/ayokoding-www/.next/ && cp -r apps/ayokoding-www/public apps/ayokoding-www/.next/standalone/apps/ayokoding-www/ && node apps/ayokoding-www/.next/standalone/apps/ayokoding-www/server.js",
    url: "http://localhost:3101",
    // This target builds the production app immediately before Playwright starts. Reusing a server
    // can bind the run to an older standalone process whose in-memory manifest no longer matches
    // the freshly replaced `.next` tree, producing cross-browser cascades of missing UI. Require
    // Playwright to own this server lifecycle so the browser proof always exercises this build.
    reuseExistingServer: false,
    timeout: 120000,
    cwd: workspaceRoot,
    env: {
      PORT: "3101",
      NODE_ENV: "production",
      // course-paths plan (Phase 3): points the standalone server's manifest loader
      // (`defaultManifestsDir()`, `AYOKODING_WEB_MANIFESTS_DIR`) at this app's own fixture manifest
      // set instead of the real, still-unpopulated `manifests/` directory — see
      // `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md`.
      AYOKODING_WEB_MANIFESTS_DIR: path.join(workspaceRoot, "apps/ayokoding-www-fe-e2e/fixtures/manifests"),
      // course-paths plan (Phase 3, PR-review fix): the `skills/e2e-fixture-{alpha,beta}` content
      // pages (`apps/ayokoding-www/content/en/learn/paths/skills/e2e-fixture-{alpha,beta}/`) are
      // authored `draft: true` so they never render on prod-ayokoding-www — this reader-level flag
      // (`content/shell/repository-fs.ts`) is what makes them visible to the e2e run that actually
      // needs their authored body content (skills-path-landing-body.feature).
      AYOKODING_WEB_SHOW_DRAFTS: "true",
    },
  },
  projects: process.env.CI
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
      ],
});
