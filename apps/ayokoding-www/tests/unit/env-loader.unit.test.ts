import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { type EnvRecord, type TierEnvPort } from "@open-sharia-enterprise/ts-env-loader";
import { loadAyokodingEnvironment } from "../../src/environment-bootstrap";
import { resolvePort } from "../../../../libs/ts-env-loader/src/port-resolver";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature"),
);

function createMemoryPort(files: Readonly<Record<string, string>>): TierEnvPort {
  return {
    exists(filePath) {
      return Object.hasOwn(files, filePath);
    },
    load(filePath, env) {
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
  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www bootstrap loads staging configuration
  Scenario("ayokoding-www bootstrap loads staging configuration", ({ Given, When, Then }) => {
    const appDir = "/app";
    let env: EnvRecord = {};
    let port: TierEnvPort = createMemoryPort({});

    Given('only ".env.stag" exists in the app directory', () => {
      port = createMemoryPort({
        [`${appDir}/.env.stag`]:
          "AYOKODING_WEB_CONTENT_DIR=/staging/content\nAYOKODING_WEB_SHOW_DRAFTS=false\nAYOKODING_WEB_MANIFESTS_DIR=/staging/manifests\n",
      });
    });
    When('the ayokoding-www environment bootstrap runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag" };
      loadAyokodingEnvironment({ appDir, env, port });
    });
    Then('each Ayokoding configuration value resolves to its ".env.stag" value', () => {
      expect(env).toMatchObject({
        AYOKODING_WEB_CONTENT_DIR: "/staging/content",
        AYOKODING_WEB_SHOW_DRAFTS: "false",
        AYOKODING_WEB_MANIFESTS_DIR: "/staging/manifests",
      });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www process env wins over the local tier file
  Scenario("ayokoding-www process env wins over the local tier file", ({ Given, When, Then, And }) => {
    const appDir = "/app";
    let env: EnvRecord = {};
    let port: TierEnvPort = createMemoryPort({});

    Given('".env.local" sets an app variable to a file value', () => {
      port = createMemoryPort({ [`${appDir}/.env.local`]: "SOME_VAR=file-value\n" });
    });
    When('the process starts with that variable already exported at tier "local"', () => {
      env = { APP_ENV: "local", SOME_VAR: "process-value" };
      loadAyokodingEnvironment({ appDir, env, port });
    });
    Then("the exported process value is used", () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });
    And('the ".env.local" value is not applied over it', () => {
      expect(env["SOME_VAR"]).not.toBe("file-value");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/env-loader/env-loader.feature: ayokoding-www tolerates a missing tier file
  Scenario("ayokoding-www tolerates a missing tier file", ({ Given, When, Then, And }) => {
    const appDir = "/app";
    const env: EnvRecord = { APP_ENV: "stag", EXISTING_VAR: "already-set" };
    let port: TierEnvPort = createMemoryPort({});
    let thrown: unknown;

    Given('no ".env.stag" file exists in the app directory', () => {
      port = createMemoryPort({});
      expect(port.exists(`${appDir}/.env.stag`)).toBe(false);
    });
    When('the loader runs with APP_ENV set to "stag"', () => {
      try {
        loadAyokodingEnvironment({ appDir, env, port });
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
    const appDir = "/app";
    const file = String(examples["file"] ?? "");
    let port: TierEnvPort = createMemoryPort({});
    let thrown: unknown;

    Given('a stray "<file>" sits beside the app\'s tier file', () => {
      port = createMemoryPort({
        [`${appDir}/.env.stag`]: "VAR=tier\n",
        [`${appDir}/${file}`]: "VAR=stray\n",
      });
    });
    When("the loader runs with APP_ENV set to a non-local tier", () => {
      try {
        loadAyokodingEnvironment({ appDir, env: { APP_ENV: "stag" }, port });
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
      const value = String(examples["value"] ?? "");
      let env: EnvRecord = {};
      let listenPort = Number.NaN;

      Given('AYOKODING_WWW_PORT is "<value>"', () => {
        env = value === "unset" ? {} : { AYOKODING_WWW_PORT: value };
      });
      When("the dev server starts", () => {
        // The same resolver the dev wrapper calls: the prefixed variable, then the compiled-in default.
        listenPort = resolvePort({ envVar: "AYOKODING_WWW_PORT", fallback: 3101, env });
      });
      Then("the dev server listens on port <port>", () => {
        expect(listenPort).toBe(Number(examples["port"]));
      });
    },
  );
});
