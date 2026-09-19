import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import {
  BACKEND_UNREACHABLE_WEB_PORT,
  MANAGES_ENVIRONMENTS,
  READY_BASE_URL,
  READY_STACK_PORTS,
  UNBOUND_BACKEND_ORIGIN,
} from "./fixtures/environments";

// Pin the tier deterministically for E2E runs — leaving APP_ENV unset would fall back to "local"
// per the tier-loader contract and read a developer's real .env.local instead of test fixtures.
process.env["APP_ENV"] ??= "test";

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/ose/id-web/behaviours",
  features: "../../specs/apps/ose/id-web/behaviours/**/*.feature",
  steps: ["./steps/**/*.steps.ts"],
  // The repository-wide convention, kept although this corpus now claims no exemption: every OSE ID
  // web scenario is driven through a real browser against a real stack.
  tags: "not @e2e-exempt",
});

/**
 * The status shell has no state of its own to observe: everything it reports, it reports because a
 * backend told it so. A browser suite that started the shell alone would therefore prove only that
 * the page renders, which is the gap that made this shell ship without ever reading its backend.
 *
 * So the default environment is the real OSE ID local stack — a PostgreSQL container, migrations, a
 * published backend, and the shell built and served against it — started through the runner that
 * already owns those resources rather than through anything reimplemented here. Its readiness probe
 * is the shell's own root: the runner starts the web shell last, so a `200` there means every stage
 * beneath it reported ready first.
 *
 * Beside it runs a second shell, cheap and instant, pointed at a loopback origin nothing is
 * listening on. That is not a weaker substitute for stopping a backend — a stopped backend leaves
 * exactly this behind, a port with no listener — and it is deterministic in a way stopping a running
 * process is not: there is no window in which the backend is still answering.
 *
 * The third environment, a stack whose database is stopped after it has been fully ready, needs a
 * readiness signal `webServer` cannot express and is established in `global-setup.ts`.
 */
const webServer: PlaywrightTestConfig["webServer"] = MANAGES_ENVIRONMENTS
  ? [
      {
        command: `node apps/ose-id-be-e2e/scripts/local-stack.mjs --fixture-profile=foundation-ready`,
        url: READY_BASE_URL,
        // Never reused: this suite's claims are about a stack in a known state, and an already
        // running listener on this port is some other run's stack, not this one's. A collision
        // fails loudly here instead of quietly changing what the scenarios observed.
        reuseExistingServer: false,
        timeout: 900_000,
        cwd: "../..",
        env: {
          APP_ENV: "test",
          OSE_ID_POSTGRES_PORT: String(READY_STACK_PORTS.postgres),
          OSE_ID_BE_PORT: String(READY_STACK_PORTS.backend),
          OSE_ID_WEB_PORT: String(READY_STACK_PORTS.web),
        },
        // The runner stops the container, the backend, and the shell it owns when it is asked to
        // stop. A SIGKILL would leave a container running, so it is given time to finish.
        gracefulShutdown: { signal: "SIGTERM", timeout: 120_000 },
      },
      {
        // Serves the prebuilt `.next` output (`test:e2e` declares the build dependency), never the
        // dev server: Turbopack's dev compiler fans out one worker per route segment on first
        // request, which exhausted memory here before the deadline.
        command: `node ../../scripts/next-with-port.mjs start --env OSE_ID_WEB_PORT --default 3500 --port ${BACKEND_UNREACHABLE_WEB_PORT}`,
        // A port probe, not a URL probe: this shell's root answers 503 by design, which `url` would
        // read as "not ready yet" and wait out.
        port: BACKEND_UNREACHABLE_WEB_PORT,
        reuseExistingServer: false,
        timeout: 180_000,
        cwd: "../ose-id-web",
        env: {
          APP_ENV: "test",
          OSE_RUNTIME_MODE: "Test",
          OSE_ID_BE_URL: UNBOUND_BACKEND_ORIGIN,
        },
      },
    ]
  : undefined;

export default defineConfig({
  testDir,
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  workers: 1,
  reporter: process.env["CI"] ? [["list"], ["html"]] : "list",
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: READY_BASE_URL,
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
