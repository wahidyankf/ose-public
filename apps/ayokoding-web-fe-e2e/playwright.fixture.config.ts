import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Fixture config for the browser boundary. It runs three things that need the parity fixture: the htmx spec over
// go-basics/learning/hello-world (data-count 109, SGD 4,718); the browser scenarios tagged @fixture, which have no
// real-corpus witness (an empty path category, a malformed manifest); and the scenarios tagged
// @fixture-until-p4-search and @fixture-until-p4-tree, whose product behaviour is not real yet. The real-corpus config
// excludes these tags, so each of these runs exactly once, on the fixture. It starts its own server on 3191 with the
// parity fixture and never reuses a listener.
const workspaceRoot = path.resolve(__dirname, "../..");
const behaviours = path.join(workspaceRoot, "specs/apps/ayokoding/web/behaviours");
const fixtureSpecs = ["htmx-fragments.spec.ts"];

// The nine HTTP-only feature files (008) belong to the be home, even when one carries @fixture.
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
].map((file) => `!${path.join(behaviours, file)}`);

// Bddgen generates the fixture scenarios below the project root, with the same steps as the real-corpus config.
const bddTestDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: [path.join(behaviours, "**/*.feature"), ...httpOnlyFeatures],
  tags: "@fixture or @fixture-until-p4-search or @fixture-until-p4-tree",
  steps: "./tests/e2e/steps/**/*.steps.ts",
  outputDir: ".features-gen/fe-fixture",
});

const browsers = [
  { name: "chromium", device: devices["Desktop Chrome"] },
  { name: "firefox", device: devices["Desktop Firefox"] },
  { name: "webkit", device: devices["Desktop Safari"] },
];

export default defineConfig({
  // Measured basis: the longest test took 2.8 s across three browsers (evidence/P3-E2E/fe-e2e-2.raw.txt). 15 s bounds a hang.
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
    screenshot: "only-on-failure",
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
    ...browsers.map(({ name, device }) => ({
      name: `bdd-fixture-${name}`,
      testDir: bddTestDir,
      use: { ...device },
    })),
    {
      name: "specs-chromium",
      testDir: "tests/e2e",
      testMatch: fixtureSpecs,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
