import path from "node:path";
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Fixture config for the HTTP boundary: the scenarios that need deterministic
// fixture data the real corpus cannot supply (see evidence/P3-E2E/fixture-scenarios.md).
// It starts its own server on 3191 with the parity fixture and never reuses a listener.
const workspaceRoot = path.resolve(__dirname, "../..");
const behaviours = path.join(workspaceRoot, "specs/apps/ayokoding/web/behaviours");

// The nine HTTP-only feature files (008). A file a later unit creates matches nothing until it exists.
const httpOnlyFeatures = [
  "content/content-tree-routes.feature",
  "content/content-rendering-http.feature",
  "navigation/url-compatibility.feature",
  "navigation/routes-and-navigation-http.feature",
  "navigation/entry-pages-http.feature",
  "search/search-http.feature",
  "discovery/discovery-documents.feature",
  "discovery/http-caching.feature",
  "local-development/local-development-http.feature",
].map((file) => path.join(behaviours, file));

const testDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: httpOnlyFeatures,
  steps: "./tests/e2e/steps/**/*.steps.ts",
  outputDir: ".features-gen/be-fixture",
  tags: "@fixture and not @fixture-unavailable",
});

export default defineConfig({
  testDir,
  // Measured basis: the longest test took 1.6 s in the be run (evidence/P3-E2E/be-e2e-1.raw.txt). 15 s bounds a hang.
  timeout: 15000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Zero retries everywhere: a failure is evidence, never flake to absorb.
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    baseURL: "http://localhost:3191",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "apps/ayokoding-web/dist/ayokoding-web",
    url: "http://localhost:3191/en",
    reuseExistingServer: false,
    // Measured basis: five starts reached the first 200 in at most 63 ms (evidence/P3-E2E/server-start-measure.txt).
    timeout: 10000,
    cwd: workspaceRoot,
    env: {
      AYOKODING_WEB_PORT: "3191",
      AYOKODING_WEB_FIXTURE: "parity",
    },
  },
  projects: [
    {
      name: "bdd-http",
      testDir,
    },
  ],
});
