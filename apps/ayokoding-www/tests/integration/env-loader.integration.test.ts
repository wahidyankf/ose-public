/**
 * Step definitions for the APP_ENV tier env-file loader feature.
 *
 * Covers: specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature
 *
 * Each scenario drives `loadTierEnv()` with an isolated `appDir` (a throwaway temp directory
 * holding fixture `.env.*` files) and an isolated `env` object (a plain record, not the real
 * `process.env`) so the suite never touches this app's real environment or filesystem tier files.
 */
import path from "path";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { loadAyokodingEnvironment } from "../../src/environment-bootstrap";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature"),
);

type EnvRecord = Record<string, string | undefined>;

const tmpDirs: string[] = [];

function makeTmpAppDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "ayokoding-www-env-loader-test-"));
  tmpDirs.push(dir);
  return dir;
}

function writeEnvFile(appDir: string, fileName: string, contents: string): void {
  writeFileSync(path.join(appDir, fileName), contents, "utf-8");
}

function cleanupTmpDirs(): void {
  for (const dir of tmpDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The real dev-server port wrapper that every Next.js app in this repository starts through. */
const DEV_WRAPPER = path.resolve(__dirname, "../../../../scripts/next-with-port.mjs");

/**
 * Runs the real wrapper in a child process whose environment holds only the given port variable, and
 * returns the port it hands to the server it starts. The `--server` form starts a one-line fixture
 * server instead of Next, which keeps the test off the network while the port resolution is the real one.
 */
function startDevWrapperPort(portValue: string | undefined): string {
  const dir = makeTmpAppDir();
  const fixture = path.join(dir, "report-port.mjs");
  writeFileSync(fixture, "process.stdout.write(String(process.env.PORT));\n", "utf-8");
  const childEnv: Record<string, string> = { PATH: process.env["PATH"] ?? "" };
  if (portValue !== undefined) childEnv["AYOKODING_WWW_PORT"] = portValue;
  const result = spawnSync(
    process.execPath,
    [DEV_WRAPPER, "--env", "AYOKODING_WWW_PORT", "--default", "3101", "--server", fixture],
    // Next's global typing requires NODE_ENV on ProcessEnv. The child is pinned to "test", the value the runner sets.
    { cwd: dir, env: { ...childEnv, NODE_ENV: "test" }, encoding: "utf8" },
  );
  expect(result.status, result.stderr).toBe(0);
  return result.stdout;
}

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupTmpDirs();
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www bootstrap loads staging configuration
  Scenario("ayokoding-www bootstrap loads staging configuration", ({ Given, When, Then }) => {
    let appDir = "";
    let env: EnvRecord = {};

    Given('only ".env.stag" exists in the app directory', () => {
      appDir = makeTmpAppDir();
      writeEnvFile(
        appDir,
        ".env.stag",
        "AYOKODING_WEB_CONTENT_DIR=/staging/content\nAYOKODING_WEB_SHOW_DRAFTS=false\nAYOKODING_WEB_MANIFESTS_DIR=/staging/manifests\n",
      );
    });

    When('the ayokoding-www environment bootstrap runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag" };
      loadAyokodingEnvironment({ appDir, env });
    });

    Then('each Ayokoding configuration value resolves to its ".env.stag" value', () => {
      expect(env["AYOKODING_WEB_CONTENT_DIR"]).toBe("/staging/content");
      expect(env["AYOKODING_WEB_SHOW_DRAFTS"]).toBe("false");
      expect(env["AYOKODING_WEB_MANIFESTS_DIR"]).toBe("/staging/manifests");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www process env wins over the local tier file
  Scenario("ayokoding-www process env wins over the local tier file", ({ Given, When, Then, And }) => {
    let appDir = "";
    let env: EnvRecord = {};

    Given('".env.local" sets an app variable to a file value', () => {
      appDir = makeTmpAppDir();
      writeEnvFile(appDir, ".env.local", "SOME_VAR=file-value\n");
    });

    When('the process starts with that variable already exported at tier "local"', () => {
      env = { APP_ENV: "local", SOME_VAR: "process-value" };
      loadAyokodingEnvironment({ appDir, env });
    });

    Then("the exported process value is used", () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });

    And('the ".env.local" value is not applied over it', () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www tolerates a missing tier file
  Scenario("ayokoding-www tolerates a missing tier file", ({ Given, When, Then, And }) => {
    let appDir = "";
    let env: EnvRecord = {};
    let thrown: unknown;

    Given('no ".env.stag" file exists in the app directory', () => {
      appDir = makeTmpAppDir();
      expect(existsSync(path.join(appDir, ".env.stag"))).toBe(false);
    });

    When('the loader runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag", EXISTING_VAR: "already-set" };
      try {
        loadAyokodingEnvironment({ appDir, env });
      } catch (error) {
        thrown = error;
      }
    });

    Then("the loader does not throw", () => {
      expect(thrown).toBeUndefined();
    });

    And("startup proceeds using whatever the process environment already supplies", () => {
      expect(env["EXISTING_VAR"]).toBe("already-set");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www fails loudly on a stray auto-loaded env file
  ScenarioOutline("ayokoding-www fails loudly on a stray auto-loaded env file", ({ Given, When, Then }, examples) => {
    const file = String(examples["file"] ?? "");
    let appDir = "";
    let thrown: unknown;

    Given('a stray "<file>" sits beside the app\'s tier file', () => {
      appDir = makeTmpAppDir();
      writeEnvFile(appDir, ".env.stag", "VAR=value\n");
      writeEnvFile(appDir, file, "VAR=other\n");
    });

    When("the loader runs with APP_ENV set to a non-local tier", () => {
      try {
        loadAyokodingEnvironment({ appDir, env: { APP_ENV: "stag" } });
      } catch (error) {
        thrown = error;
      }
    });

    Then('the loader throws, naming "<file>" and the correct ".env.<tier>" replacement', () => {
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain(file);
      expect((thrown as Error).message).toContain(".env.stag");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: The dev server listens on AYOKODING_WWW_PORT and defaults to port 3101
  ScenarioOutline(
    "The dev server listens on AYOKODING_WWW_PORT and defaults to port 3101",
    ({ Given, When, Then }, examples) => {
      let portValue: string | undefined;
      let handedPort = "";

      Given('AYOKODING_WWW_PORT is "<value>"', () => {
        portValue = examples["value"] === "unset" ? undefined : String(examples["value"]);
      });
      When("the dev server starts", () => {
        handedPort = startDevWrapperPort(portValue);
      });
      Then("the dev server listens on port <port>", () => {
        expect(handedPort).toBe(String(examples["port"]));
      });
    },
  );
});

// Rule 1 (APP_ENV unset defaults to "local") is covered once, directly against `resolveTier`, in
// @open-sharia-enterprise/ts-env-loader's own test suite (libs/ts-env-loader/src/env-loader.unit.test.ts)
// — not re-tested per app.
