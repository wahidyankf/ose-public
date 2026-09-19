/**
 * Step definitions for ts-env-loader's own APP_ENV tier loader feature.
 *
 * Covers: specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature
 *
 * Each scenario drives `loadTierEnv()` through an in-memory file port and an isolated `env`
 * object. No setup, subject, or assertion touches the process environment or filesystem.
 */
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { describe, expect, it } from "vitest";
import { loadTierEnv, resolveTier, type EnvRecord, type TierEnvPort } from "../../src/index";

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
});

// Rule 1 of the loader contract (APP_ENV unset defaults to "local") is exercised directly against
// the pure `resolveTier` function rather than through a Gherkin scenario — every scenario above
// always supplies a concrete APP_ENV, so this is the sole place the default branch executes.
describe("resolveTier", () => {
  it("defaults to local when APP_ENV is unset", () => {
    expect(resolveTier({})).toBe("local");
  });

  it("defaults to local when APP_ENV is an empty string", () => {
    expect(resolveTier({ APP_ENV: "" })).toBe("local");
  });
});
