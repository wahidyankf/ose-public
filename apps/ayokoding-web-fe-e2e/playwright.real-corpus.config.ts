import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// The browser boundary's one config. It binds every feature file under the corpus except the nine HTTP-only
// files, which the HTTP home binds (008). The server starts with no fixture selected, so it serves the real corpus.
// The Go server owns port 3191 for the acceptance suite. The binary under test is built by `ayokoding-web-fe-e2e:test:e2e`
// through its declared dependency on `ayokoding-web:build`, and Playwright always owns this server's lifecycle.
const workspaceRoot = path.resolve(__dirname, "../..");
const behaviours = path.join(workspaceRoot, "specs/apps/ayokoding/web/behaviours");

// The nine HTTP-only feature files (008). The browser home excludes them by negated globs.
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

// Bddgen generates the browser corpus specs below the project root. The ordinary specs in tests/e2e run under the
// specs-<browser> projects with their own testDir, because the BDD runtime resolves its config from the generated directory.
const testDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: [path.join(behaviours, "**/*.feature"), ...httpOnlyFeatures],
  // Fixture-owned scenarios run only on the parity fixture (playwright.fixture.config.ts). Each carries the unit that
  // moves it: @fixture (no real witness), @fixture-until-p4-search and @fixture-until-p4-tree (behaviour delivered by a
  // later unit). P3-Render's rows run here on real-corpus witnesses.
  tags: "not @fixture and not @fixture-until-p4-search and not @fixture-until-p4-tree",
  steps: "./tests/e2e/steps/**/*.steps.ts",
  outputDir: ".features-gen/fe-real-corpus",
});

// htmx-fragments.spec.ts moved to playwright.fixture.config.ts: it asserts fixture content the real corpus lacks.
const specFiles = ["browser-progress.spec.ts", "playwright-owned-server.spec.ts"];

const browsers = [
  { name: "chromium", device: devices["Desktop Chrome"] },
  { name: "firefox", device: devices["Desktop Firefox"] },
  { name: "webkit", device: devices["Desktop Safari"] },
];

export default defineConfig({
  // Measured basis: the longest test took 2.8 s across three browsers (evidence/P3-E2E/fe-e2e-2.raw.txt). 15 s bounds a hang.
  timeout: 15000,
  // One worker: progress, storage, and port-stub scenarios share origin state and loopback listeners, so they must not overlap.
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
    },
  },
  projects: browsers.flatMap(({ name, device }) => [
    {
      name: `bdd-${name}`,
      testDir,
      use: { ...device },
    },
    {
      name: `specs-${name}`,
      testDir: "tests/e2e",
      testMatch: specFiles,
      use: { ...device },
    },
  ]),
});
