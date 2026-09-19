/**
 * Step definitions for the APP_ENV tier env-file loader feature.
 *
 * Covers: specs/apps/organiclever/www/behaviours/frontend/env-loader/env-loader.feature
 *
 * Each scenario drives `loadTierEnv()` with an in-memory file port and an isolated `env` object
 * (a plain record, not the real `process.env`) so this Unit suite never touches the filesystem or
 * ambient process environment.
 */
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { type TierEnvPort } from "@open-sharia-enterprise/ts-env-loader";
import { loadOrganicLeverWwwEnvironment } from "../../src/environment-bootstrap";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/apps/organiclever/www/behaviours/frontend/env-loader/env-loader.feature"),
);

type EnvRecord = Record<string, string | undefined>;

function inMemoryTierEnv(files: Record<string, string>): TierEnvPort {
  return {
    exists: (filePath) => Object.hasOwn(files, filePath),
    load: (filePath, env) => {
      const source = files[filePath];
      if (source === undefined) return;
      for (const line of source.split("\n")) {
        const separator = line.indexOf("=");
        if (separator < 1) continue;
        const key = line.slice(0, separator);
        if (env[key] === undefined) env[key] = line.slice(separator + 1);
      }
    },
  };
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario("organiclever-www bootstrap selects the staging tier file", ({ Given, When, Then }) => {
    const appDir = "/synthetic/organiclever-www";
    let port: TierEnvPort = inMemoryTierEnv({});
    let env: EnvRecord = {};

    Given('only ".env.stag" exists in the app directory', () => {
      port = inMemoryTierEnv({
        [path.join(appDir, ".env.stag")]: "ORGANICLEVER_WWW_BOOTSTRAP_MARKER=stag-value\n",
      });
    });

    When('the organiclever-www environment bootstrap runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag" };
      loadOrganicLeverWwwEnvironment({ appDir, env, port });
    });

    Then('only the ".env.stag" values are loaded into the app process', () => {
      expect(env).toEqual({ APP_ENV: "stag", ORGANICLEVER_WWW_BOOTSTRAP_MARKER: "stag-value" });
    });
  });

  Scenario("organiclever-www process env wins over the local tier file", ({ Given, When, Then, And }) => {
    const appDir = "/synthetic/organiclever-www";
    let port: TierEnvPort = inMemoryTierEnv({});
    let env: EnvRecord = {};

    Given('".env.local" sets an app variable to a file value', () => {
      port = inMemoryTierEnv({ [path.join(appDir, ".env.local")]: "SOME_VAR=file-value\n" });
    });

    When('the process starts with that variable already exported at tier "local"', () => {
      env = { APP_ENV: "local", SOME_VAR: "process-value" };
      loadOrganicLeverWwwEnvironment({ appDir, env, port });
    });

    Then("the exported process value is used", () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });

    And('the ".env.local" value is not applied over it', () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });
  });

  Scenario("organiclever-www tolerates a missing tier file", ({ Given, When, Then, And }) => {
    const appDir = "/synthetic/organiclever-www";
    const files: Record<string, string> = {};
    const port = inMemoryTierEnv(files);
    let env: EnvRecord = {};
    let thrown: unknown;

    Given('no ".env.stag" file exists in the app directory', () => {
      expect(port.exists(path.join(appDir, ".env.stag"))).toBe(false);
    });

    When('the loader runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag", EXISTING_VAR: "already-set" };
      try {
        loadOrganicLeverWwwEnvironment({ appDir, env, port });
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

  ScenarioOutline(
    "organiclever-www fails loudly on a stray auto-loaded env file",
    ({ Given, When, Then }, examples) => {
      const file = String(examples["file"] ?? "");
      const appDir = "/synthetic/organiclever-www";
      let port: TierEnvPort = inMemoryTierEnv({});
      let thrown: unknown;

      // Vitest-Cucumber matches this definition against the outline's un-substituted step text, so
      // `{string}` must match the raw "<file>" token as well as a substituted file name.
      Given("a stray {string} sits beside the app's tier file", () => {
        port = inMemoryTierEnv({
          [path.join(appDir, ".env.stag")]: "VAR=value\n",
          [path.join(appDir, file)]: "VAR=other\n",
        });
      });

      When("the loader runs with APP_ENV set to a non-local tier", () => {
        try {
          loadOrganicLeverWwwEnvironment({ appDir, env: { APP_ENV: "stag" }, port });
        } catch (error) {
          thrown = error;
        }
      });

      Then('the loader throws, naming {string} and the correct ".env.<tier>" replacement', () => {
        expect(thrown).toBeInstanceOf(Error);
        expect((thrown as Error).message).toContain(file);
        expect((thrown as Error).message).toContain(".env.stag");
      });
    },
  );
});
