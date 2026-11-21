/**
 * Step definitions for ts-env-loader's own APP_ENV tier loader feature.
 *
 * Covers: specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature
 *
 * Each scenario drives `loadTierEnv()` through an in-memory file port and an isolated `env`
 * object. No setup, subject, or assertion touches the process environment or filesystem, except
 * the two scenarios that prove the default options (the working directory and `process.env`); those
 * restore every value they change before they return.
 */
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { describe, expect, it, vi, type MockInstance } from "vitest";
import { loadTierEnv, resolveTier, tierEnvFilePath, type EnvRecord, type TierEnvPort } from "../../src/index";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature"),
);

const appDir = path.resolve("/virtual/ts-env-loader-app");

function memoryPort(files: Readonly<Record<string, string>>): TierEnvPort {
  return {
    exists: (filePath) => Object.hasOwn(files, filePath),
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

function fixtureFiles(entries: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(entries).map(([name, contents]) => [path.join(appDir, name), contents]));
}

function invoke(env: EnvRecord, files: Readonly<Record<string, string>>): void {
  loadTierEnv({ appDir, env, port: memoryPort(files) });
}

function missing(fileName: string, files: Readonly<Record<string, string>>): boolean {
  return !Object.hasOwn(files, path.join(appDir, fileName));
}

function fileFixture(fileName: string, contents: string): Record<string, string> {
  return fixtureFiles({ [fileName]: contents });
}

function mergeFiles(...sets: ReadonlyArray<Readonly<Record<string, string>>>): Record<string, string> {
  return Object.assign({}, ...sets);
}

function tierFile(contents = "VAR=value\n"): Record<string, string> {
  return fileFixture(".env.stag", contents);
}

function localTierFile(contents = "VAR=value\n"): Record<string, string> {
  return fileFixture(".env.local", contents);
}

function strayFile(name: string, contents = "VAR=other\n"): Record<string, string> {
  return fileFixture(name, contents);
}

function capture(action: () => void): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Loads the selected tier's file
  Scenario("Loads the selected tier's file", ({ Given, When, Then }) => {
    let files: Record<string, string> = {};
    let env: EnvRecord = {};

    Given('only ".env.stag" exists in the app directory', () => {
      files = tierFile("SHARED_VAR=stag-value\nSTAG_ONLY_VAR=stag-only\n");
    });

    When('the loader runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag" };
      invoke(env, files);
    });

    Then('every variable defined in ".env.stag" is applied', () => {
      expect(env["SHARED_VAR"]).toBe("stag-value");
      expect(env["STAG_ONLY_VAR"]).toBe("stag-only");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Process env always wins over the tier file
  Scenario("Process env always wins over the tier file", ({ Given, When, Then, And }) => {
    let files: Record<string, string> = {};
    let env: EnvRecord = {};

    Given('".env.local" sets a variable to a file value', () => {
      files = localTierFile("SOME_VAR=file-value\n");
    });

    When('the process already has that variable set at tier "local"', () => {
      env = { APP_ENV: "local", SOME_VAR: "process-value" };
      invoke(env, files);
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
    let files: Record<string, string> = {};
    let env: EnvRecord = {};
    let thrown: unknown;

    Given('no ".env.stag" file exists in the app directory', () => {
      files = {};
      expect(missing(".env.stag", files)).toBe(true);
    });

    When('the loader runs with APP_ENV set to "stag"', () => {
      env = { APP_ENV: "stag", EXISTING_VAR: "already-set" };
      try {
        invoke(env, files);
      } catch (error) {
        thrown = error;
      }
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
    let files: Record<string, string> = {};
    let thrown: unknown;

    // Vitest-Cucumber matches this definition against the outline's un-substituted step text, so
    // `{string}` must match the raw "<file>" token as well as a substituted file name.
    Given("a stray {string} sits beside the tier file", () => {
      files = mergeFiles(tierFile(), strayFile(file));
    });

    When("the loader runs with APP_ENV set to a non-local tier", () => {
      thrown = capture(() => invoke({ APP_ENV: "stag" }, files));
    });

    Then('the loader throws, naming {string} and the correct ".env.<tier>" replacement', () => {
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain(file);
      expect((thrown as Error).message).toContain(".env.stag");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: Tolerates a stray file at the local tier
  Scenario("Tolerates a stray file at the local tier", ({ Given, When, Then }) => {
    let files: Record<string, string> = {};
    let thrown: unknown;

    Given('a stray ".env" sits beside ".env.local"', () => {
      files = mergeFiles(localTierFile(), strayFile(".env"));
    });

    When('the loader runs with APP_ENV set to "local"', () => {
      thrown = capture(() => invoke({ APP_ENV: "local" }, files));
    });

    Then("the loader does not throw", () => {
      expect(thrown).toBeUndefined();
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: The tier is local when APP_ENV is unset or empty
  Scenario("The tier is local when APP_ENV is unset or empty", ({ Given, When, Then }) => {
    let files: Record<string, string> = {};
    let unset: EnvRecord = {};
    let empty: EnvRecord = {};

    Given('the app directory has a ".env.local" file setting "LOCAL_TIER_VAR" to "local-value"', () => {
      files = localTierFile("LOCAL_TIER_VAR=local-value\n");
    });

    When("the loader runs with APP_ENV unset or empty", () => {
      unset = {};
      empty = { APP_ENV: "" };
      invoke(unset, files);
      invoke(empty, files);
    });

    Then('the ".env.local" file is applied in both cases', () => {
      expect(unset["LOCAL_TIER_VAR"]).toBe("local-value");
      expect(empty["LOCAL_TIER_VAR"]).toBe("local-value");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: The tier file path is the tier's dotenv file inside the app directory
  Scenario("The tier file path is the tier's dotenv file inside the app directory", ({ Given, When, Then }) => {
    let computed = "";

    Given("the app directory is the virtual app directory", () => {
      expect(appDir.length).toBeGreaterThan(0);
    });

    When('the tier file path is built for tier "stag"', () => {
      computed = tierEnvFilePath("stag", appDir);
    });

    Then('the path is the ".env.stag" file inside the app directory', () => {
      expect(computed).toBe(path.join(appDir, ".env.stag"));
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature: With no options the loader reads the working directory and process.env
  Scenario("With no options the loader reads the working directory and process.env", ({ Given, When, Then }) => {
    // Only the file port is injected here: the working directory and process.env are the defaults under test.
    const variable = "CWD_TIER_VAR";
    let files: Record<string, string> = {};
    let cwdSpy: MockInstance | undefined;

    Given('the working directory has a ".env.stag" file setting "CWD_TIER_VAR" to "from-cwd"', () => {
      files = tierFile("CWD_TIER_VAR=from-cwd\n");
    });

    When('the loader runs with no options and APP_ENV set to "stag"', () => {
      delete process.env[variable];
      process.env["APP_ENV"] = "stag";
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(appDir);
      loadTierEnv({ port: memoryPort(files) });
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
    let cwdSpy: MockInstance | undefined;

    Given('the working directory has a ".env.stag" file setting "IMPORT_PROBE_VAR" to "from-file"', () => {
      // The virtual directory holds no real file; the integration binding proves the file-backed case.
      delete process.env[variable];
    });

    When('the package is imported with APP_ENV set to "stag"', async () => {
      process.env["APP_ENV"] = "stag";
      cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(appDir);
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

// Rule 1 of the loader contract (APP_ENV unset defaults to "local") is also exercised directly against
// the pure `resolveTier` function; the scenario above drives the same default through `loadTierEnv`.
describe("resolveTier", () => {
  it("defaults to local when APP_ENV is unset", () => {
    expect(resolveTier({})).toBe("local");
  });

  it("defaults to local when APP_ENV is an empty string", () => {
    expect(resolveTier({ APP_ENV: "" })).toBe("local");
  });
});
