/** Real-filesystem adapter for the APP_ENV tier-loader behaviour. */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, vi, type MockInstance } from "vitest";
import { loadTierEnv, tierEnvFilePath, type EnvRecord } from "../../src/index";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature"),
);

const temporaryDirectories: string[] = [];

function temporaryAppDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "ts-env-loader-integration-"));
  temporaryDirectories.push(directory);
  return directory;
}

function writeEnvFile(appDirectory: string, name: string, contents: string): void {
  writeFileSync(path.join(appDirectory, name), contents, "utf8");
}

function capture(action: () => void): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Loads the selected tier's file
  Scenario("Loads the selected tier's file", ({ Given, When, Then }) => {
    let appDirectory = "";
    let env: EnvRecord = {};

    Given('only ".env.stag" exists in the app directory', () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.stag", "SHARED_VAR=stag-value\nSTAG_ONLY_VAR=stag-only\n");
    });

    When('the loader runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag" };
      loadTierEnv({ appDir: appDirectory, env });
    });

    Then('every variable defined in ".env.stag" is applied', () => {
      expect(env["SHARED_VAR"]).toBe("stag-value");
      expect(env["STAG_ONLY_VAR"]).toBe("stag-only");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Process env always wins over the tier file
  Scenario("Process env always wins over the tier file", ({ Given, When, Then, And }) => {
    let appDirectory = "";
    let env: EnvRecord = {};

    Given('".env.local" sets a variable to a file value', () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.local", "SOME_VAR=file-value\n");
    });

    When('the process already has that variable set at tier "local"', () => {
      env = { APP_ENV: "local", SOME_VAR: "process-value" };
      loadTierEnv({ appDir: appDirectory, env });
    });

    Then("the process value is used", () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });

    And('the ".env.local" value is not applied over it', () => {
      expect(env["SOME_VAR"]).toBe("process-value");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Tolerates a missing tier file
  Scenario("Tolerates a missing tier file", ({ Given, When, Then, And }) => {
    let appDirectory = "";
    let env: EnvRecord = {};
    let thrown: unknown;

    Given('no ".env.stag" file exists in the app directory', () => {
      appDirectory = temporaryAppDirectory();
      expect(existsSync(path.join(appDirectory, ".env.stag"))).toBe(false);
    });

    When('the loader runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag", EXISTING_VAR: "already-set" };
      thrown = capture(() => loadTierEnv({ appDir: appDirectory, env }));
    });

    Then("the loader does not throw", () => {
      expect(thrown).toBeUndefined();
    });

    And("the process environment is left otherwise untouched", () => {
      expect(env["EXISTING_VAR"]).toBe("already-set");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Fails loudly on a stray auto-loaded env file
  ScenarioOutline("Fails loudly on a stray auto-loaded env file", ({ Given, When, Then }, examples) => {
    const file = String(examples["file"] ?? "");
    let appDirectory = "";
    let thrown: unknown;

    Given("a stray {string} sits beside the tier file", () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.stag", "VAR=value\n");
      writeEnvFile(appDirectory, file, "VAR=other\n");
    });

    When("the loader runs with APP_ENV set to a non-local tier", () => {
      thrown = capture(() => loadTierEnv({ appDir: appDirectory, env: { APP_ENV: "stag" } }));
    });

    Then('the loader throws, naming {string} and the correct ".env.<tier>" replacement', () => {
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain(file);
      expect((thrown as Error).message).toContain(".env.stag");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Tolerates a stray file at the local tier
  Scenario("Tolerates a stray file at the local tier", ({ Given, When, Then }) => {
    let appDirectory = "";
    let thrown: unknown;

    Given('a stray ".env" sits beside ".env.local"', () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.local", "VAR=value\n");
      writeEnvFile(appDirectory, ".env", "VAR=other\n");
    });

    When('the loader runs with APP_ENV set to "local"', () => {
      thrown = capture(() => loadTierEnv({ appDir: appDirectory, env: { APP_ENV: "local" } }));
    });

    Then("the loader does not throw", () => {
      expect(thrown).toBeUndefined();
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: The tier is local when APP_ENV is unset or empty
  Scenario("The tier is local when APP_ENV is unset or empty", ({ Given, When, Then }) => {
    let appDirectory = "";
    let unset: EnvRecord = {};
    let empty: EnvRecord = {};

    Given('the app directory has a ".env.local" file setting "LOCAL_TIER_VAR" to "local-value"', () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.local", "LOCAL_TIER_VAR=local-value\n");
    });

    When("the loader runs with APP_ENV unset or empty", () => {
      unset = {};
      empty = { APP_ENV: "" };
      loadTierEnv({ appDir: appDirectory, env: unset });
      loadTierEnv({ appDir: appDirectory, env: empty });
    });

    Then('the ".env.local" file is applied in both cases', () => {
      expect(unset["LOCAL_TIER_VAR"]).toBe("local-value");
      expect(empty["LOCAL_TIER_VAR"]).toBe("local-value");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: The tier file path is the tier's dotenv file inside the app directory
  Scenario("The tier file path is the tier's dotenv file inside the app directory", ({ Given, When, Then }) => {
    let appDirectory = "";
    let computed = "";

    Given("the app directory is the virtual app directory", () => {
      appDirectory = temporaryAppDirectory();
    });

    When('the tier file path is built for tier "stag"', () => {
      writeEnvFile(appDirectory, ".env.stag", "PATH_PROBE_VAR=from-path\n");
      computed = tierEnvFilePath("stag", appDirectory);
    });

    Then('the path is the ".env.stag" file inside the app directory', () => {
      expect(computed).toBe(path.join(appDirectory, ".env.stag"));
      expect(existsSync(computed)).toBe(true);
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: With no options the loader reads the working directory and process.env
  Scenario("With no options the loader reads the working directory and process.env", ({ Given, When, Then }) => {
    const variable = "CWD_TIER_VAR";
    let appDirectory = "";
    let cwdSpy: MockInstance | undefined;

    Given('the working directory has a ".env.stag" file setting "CWD_TIER_VAR" to "from-cwd"', () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.stag", "CWD_TIER_VAR=from-cwd\n");
    });

    When('the loader runs with no options and APP_ENV set to "stag"', () => {
      delete process.env[variable];
      process.env["APP_ENV"] = "stag";
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(appDirectory);
      loadTierEnv();
    });

    Then('the process environment has "CWD_TIER_VAR" set to "from-cwd"', () => {
      try {
        expect(process.env[variable]).toBe("from-cwd");
      } finally {
        cwdSpy?.mockRestore();
        delete process.env[variable];
        delete process.env["APP_ENV"];
      }
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Importing the package never loads a tier file
  Scenario("Importing the package never loads a tier file", ({ Given, When, Then }) => {
    const variable = "IMPORT_PROBE_VAR";
    let appDirectory = "";
    let cwdSpy: MockInstance | undefined;

    Given('the working directory has a ".env.stag" file setting "IMPORT_PROBE_VAR" to "from-file"', () => {
      appDirectory = temporaryAppDirectory();
      writeEnvFile(appDirectory, ".env.stag", "IMPORT_PROBE_VAR=from-file\n");
    });

    When('the package is imported with APP_ENV set to "stag"', async () => {
      delete process.env[variable];
      process.env["APP_ENV"] = "stag";
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(appDirectory);
      vi.resetModules();
      await import("../../src/index");
    });

    Then('the process environment has no "IMPORT_PROBE_VAR" value', () => {
      try {
        expect(process.env[variable]).toBeUndefined();
      } finally {
        cwdSpy?.mockRestore();
        delete process.env[variable];
        delete process.env["APP_ENV"];
      }
    });
  });
});
