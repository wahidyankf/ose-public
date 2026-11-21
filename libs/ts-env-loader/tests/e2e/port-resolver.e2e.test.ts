/** Real-process adapter for the runtime listener port-resolution behaviour. */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { afterAll, beforeAll, expect } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const wrapper = path.join(repoRoot, "scripts/next-with-port.mjs");
const feature = await loadFeature(
  path.join(repoRoot, "specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature"),
);

let fixtureDirectory: string;
let fixtureServer: string;

beforeAll(() => {
  fixtureDirectory = mkdtempSync(path.join(tmpdir(), "next-with-port-e2e-"));
  fixtureServer = path.join(fixtureDirectory, "server.js");
  writeFileSync(fixtureServer, 'console.log("PORT=" + process.env.PORT);\n');
});

afterAll(() => {
  rmSync(fixtureDirectory, { recursive: true, force: true });
});

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

interface ProcessContext {
  envVariable: string;
  fallback: number;
  environment: Record<string, string>;
  result?: RunResult;
}

function context(): ProcessContext {
  return { envVariable: "", fallback: 0, environment: {} };
}

function runWrapper(state: ProcessContext, flag?: string): Promise<RunResult> {
  const args = ["--env", state.envVariable, "--default", String(state.fallback)];
  if (flag !== undefined && flag !== "") args.push("--port", flag);
  args.push("--server", fixtureServer);

  const environment = { ...process.env };
  delete environment["OSE_WWW_PORT"];
  delete environment["PORT"];
  Object.assign(environment, state.environment);

  return new Promise((resolve) => {
    const child = spawn("node", [wrapper, ...args], { cwd: repoRoot, env: environment });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function declaresStandardApp(state: ProcessContext): void {
  state.envVariable = "OSE_WWW_PORT";
  state.fallback = 3100;
}

function expectSuccessfulPort(state: ProcessContext, expected: number): void {
  expect(state.result?.code).toBe(0);
  expect(state.result?.stdout).toContain(`PORT=${expected}`);
}

function expectRangeFailure(state: ProcessContext, source: string): void {
  expect(state.result?.code).not.toBe(0);
  expect(state.result?.stderr).toContain(source);
  expect(state.result?.stderr).toContain("65535");
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A port resolves from the highest source that supplies one
  ScenarioOutline(
    "A port resolves from the highest source that supplies one",
    ({ Given, And, When, Then }, examples) => {
      const state = context();
      const flagValue = String(examples["flagValue"] ?? "");
      const envValue = String(examples["envValue"] ?? "");
      const expected = Number(examples["expected"]);

      Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
        declaresStandardApp(state);
      });
      And('the environment sets "OSE_WWW_PORT" to {string}', () => {
        state.environment = { OSE_WWW_PORT: envValue };
      });
      When('the port resolves with a "--port" flag of {string}', async () => {
        state.result = await runWrapper(state, flagValue);
      });
      Then("the resolved port is {any}", () => {
        expectSuccessfulPort(state, expected);
      });
    },
  );

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A bare PORT variable never moves the listener
  Scenario("A bare PORT variable never moves the listener", ({ Given, And, When, Then }) => {
    const state = context();

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
      declaresStandardApp(state);
    });
    And('the environment sets "PORT" to "4000"', () => {
      state.environment = { PORT: "4000" };
    });
    And('the environment does not set "OSE_WWW_PORT"', () => {
      expect(state.environment["OSE_WWW_PORT"]).toBeUndefined();
    });
    When('the port resolves with no "--port" flag', async () => {
      state.result = await runWrapper(state);
    });
    Then("the resolved port is 3100", () => {
      expectSuccessfulPort(state, 3100);
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A blank value at a tier falls through to the next tier
  ScenarioOutline("A blank value at a tier falls through to the next tier", ({ Given, And, When, Then }, examples) => {
    const state = context();
    const flagValue = String(examples["flagValue"] ?? "");
    const envValue = String(examples["envValue"] ?? "");
    const expected = Number(examples["expected"]);

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
      declaresStandardApp(state);
    });
    And('the environment sets "OSE_WWW_PORT" to {string}', () => {
      state.environment = { OSE_WWW_PORT: envValue };
    });
    When('the port resolves with a "--port" flag of {string}', async () => {
      state.result = await runWrapper(state, flagValue);
    });
    Then("the resolved port is {any}", () => {
      expectSuccessfulPort(state, expected);
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A malformed port is rejected with an error naming its source and the valid range
  ScenarioOutline(
    "A malformed port is rejected with an error naming its source and the valid range",
    ({ Given, And, When, Then }, examples) => {
      const state = context();
      const source = String(examples["source"] ?? "");
      const flagValue = String(examples["flagValue"] ?? "");
      const envValue = String(examples["envValue"] ?? "");

      Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
        declaresStandardApp(state);
      });
      And('the environment sets "OSE_WWW_PORT" to {string}', () => {
        state.environment = { OSE_WWW_PORT: envValue };
      });
      When('the port resolves with a "--port" flag of {string}', async () => {
        state.result = await runWrapper(state, flagValue);
      });
      Then("resolution throws, naming {string} and the valid range", () => {
        expectRangeFailure(state, source);
      });
    },
  );

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: An out-of-range compiled-in fallback is caught at startup
  Scenario("An out-of-range compiled-in fallback is caught at startup", ({ Given, And, When, Then }) => {
    const state = context();

    Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 70000', () => {
      state.envVariable = "OSE_WWW_PORT";
      state.fallback = 70000;
    });
    And('the environment does not set "OSE_WWW_PORT"', () => {
      state.environment = {};
    });
    When('the port resolves with no "--port" flag', async () => {
      state.result = await runWrapper(state);
    });
    Then('resolution throws, naming "OSE_WWW_PORT" and the valid range', () => {
      expectRangeFailure(state, "OSE_WWW_PORT");
    });
  });

  // @scenario specs/libs/ts-env-loader/behaviours/port-resolver/port-resolver.feature: A whitespace-only flag or variable is blank and falls through to the next tier
  Scenario(
    "A whitespace-only flag or variable is blank and falls through to the next tier",
    ({ Given, And, When, Then }) => {
      const state = context();

      Given('the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100', () => {
        declaresStandardApp(state);
      });
      And('the environment sets "OSE_WWW_PORT" to "   "', () => {
        state.environment = { OSE_WWW_PORT: "   " };
      });
      When('the port resolves with a "--port" flag of "   "', async () => {
        state.result = await runWrapper(state, "   ");
      });
      Then("the resolved port is 3100", () => {
        expectSuccessfulPort(state, 3100);
      });
    },
  );
});
