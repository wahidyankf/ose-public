import path from "node:path";
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Pin the tier deterministically for e2e runs — leaving APP_ENV unset would fall back to
// "local" per the loader contract in plans/in-progress/restrict-env-access-to-prod-and-stag,
// which would read a developer's real .env.local instead of test fixtures.
process.env.APP_ENV ??= "test";

const workspaceRoot = path.resolve(__dirname, "../..");

const testDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: [
    path.join(workspaceRoot, "specs/apps/ayokoding/www/behaviours/backend/**/*.feature"),
    // The learn section's three-structural-bucket invariant is a backend/build-time filesystem
    // check (no runtime API surface), but its Gherkin lives under frontend/navigation/ (it
    // describes what a reader browsing /learn sees) rather than backend/ — so it's outside this
    // project's own glob above. Listed separately rather than widening to the full
    // frontend/**/*.feature tree, which would pull in ~130 unrelated frontend scenarios this
    // backend-only project has no business generating tests for.
    path.join(workspaceRoot, "specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature"),
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
    reuseExistingServer: true,
    timeout: 120000,
    cwd: workspaceRoot,
    env: {
      PORT: "3101",
      NODE_ENV: "production",
    },
  },
});
