// The two ayokoding e2e Playwright configs choose their run selection from CI and from the explicit E2E_FULL_MATRIX
// opt-in. Each case loads the real config file under a controlled environment, with @playwright/test and playwright-bdd
// replaced by inert stubs, and asserts the selection the config produces. Nothing here runs a browser.
import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const { register } = require("tsx/cjs/api");

const REPO = resolve(import.meta.dirname, "..");
const FE_CONFIG = resolve(REPO, "apps/ayokoding-www-fe-e2e/playwright.config.ts");
const BE_CONFIG = resolve(REPO, "apps/ayokoding-www-be-e2e/playwright.config.ts");
const TOUCHED_ENV = ["CI", "E2E_FULL_MATRIX", "APP_ENV"];

const stubs = {
  "@playwright/test": {
    defineConfig: (config) => config,
    devices: {
      "Desktop Chrome": { defaultBrowserType: "chromium" },
      "Desktop Firefox": { defaultBrowserType: "firefox" },
      "Desktop Safari": { defaultBrowserType: "webkit" },
    },
  },
  "playwright-bdd": { defineBddConfig: () => "stub-test-dir" },
};

/** Loads a config file with the given CI-related environment and returns its default export and the CI value after load. */
function loadConfig(configPath, env) {
  const saved = Object.fromEntries(TOUCHED_ENV.map((key) => [key, process.env[key]]));
  for (const key of TOUCHED_ENV) delete process.env[key];
  Object.assign(process.env, env);
  const originalLoad = Module._load;
  const unregister = register();
  Module._load = function load(request, parent, isMain) {
    if (Object.hasOwn(stubs, request)) return stubs[request];
    return originalLoad.call(this, request, parent, isMain);
  };
  delete require.cache[configPath];
  try {
    const config = require(configPath).default;
    return { config, ciAfterLoad: process.env.CI };
  } finally {
    Module._load = originalLoad;
    unregister();
    for (const key of TOUCHED_ENV) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

function selectionOf(config) {
  return {
    projects: config.projects?.map((project) => project.name),
    retries: config.retries,
    workers: config.workers,
  };
}

const ALL_BROWSERS = ["chromium", "firefox", "webkit"];

test("fe e2e: with the knob off, CI selects chromium only with two retries and one worker", () => {
  const { config } = loadConfig(FE_CONFIG, { CI: "true" });
  assert.deepEqual(selectionOf(config), { projects: ["chromium"], retries: 2, workers: 1 });
  assert.equal(config.forbidOnly, true);
});

test("fe e2e: with the knob on and CI set, all three browsers run with zero retries and no worker cap", () => {
  const { config, ciAfterLoad } = loadConfig(FE_CONFIG, { CI: "true", E2E_FULL_MATRIX: "1" });
  assert.deepEqual(selectionOf(config), { projects: ALL_BROWSERS, retries: 0, workers: undefined });
  assert.equal(config.forbidOnly, true, "forbidOnly still follows CI");
  assert.equal(ciAfterLoad, "true", "the knob must not rewrite CI");
});

test("fe e2e: with neither CI nor the knob, the local selection is unchanged", () => {
  const { config } = loadConfig(FE_CONFIG, {});
  assert.deepEqual(selectionOf(config), { projects: ALL_BROWSERS, retries: 0, workers: undefined });
  assert.equal(config.forbidOnly, false);
});

test("fe e2e: only the exact value 1 opts in to the full matrix", () => {
  for (const value of ["true", "0", ""]) {
    const { config } = loadConfig(FE_CONFIG, { CI: "true", E2E_FULL_MATRIX: value });
    assert.deepEqual(
      selectionOf(config),
      { projects: ["chromium"], retries: 2, workers: 1 },
      `value ${JSON.stringify(value)}`,
    );
  }
});

test("be e2e: with the knob off, CI keeps two retries and one worker", () => {
  const { config } = loadConfig(BE_CONFIG, { CI: "true" });
  assert.deepEqual(selectionOf(config), { projects: undefined, retries: 2, workers: 1 });
  assert.equal(config.forbidOnly, true);
});

test("be e2e: with the knob on and CI set, zero retries and no worker cap, with forbidOnly still following CI", () => {
  const { config, ciAfterLoad } = loadConfig(BE_CONFIG, { CI: "true", E2E_FULL_MATRIX: "1" });
  assert.deepEqual(selectionOf(config), { projects: undefined, retries: 0, workers: undefined });
  assert.equal(config.forbidOnly, true, "forbidOnly still follows CI");
  assert.equal(ciAfterLoad, "true", "the knob must not rewrite CI");
});

test("be e2e: with neither CI nor the knob, the local selection is unchanged", () => {
  const { config } = loadConfig(BE_CONFIG, {});
  assert.deepEqual(selectionOf(config), { projects: undefined, retries: 0, workers: undefined });
  assert.equal(config.forbidOnly, false);
});
