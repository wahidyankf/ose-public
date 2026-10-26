import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { buildWorkerOptions } from "../../src/build-workers";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature",
  ),
);

const UNSET_CELL = "unset";
const QUOTED_CELL = /^"(.*)"$/;
const SANITIZED_WORKER_ERROR = "AYOKODING_WWW_BUILD_WORKERS must be 1 or 2 when set.";
const RESULT_CELLS: Readonly<Record<string, Readonly<{ cpus?: number }>>> = {
  "{ cpus: 1 }": { cpus: 1 },
  "{ cpus: 2 }": { cpus: 2 },
  "{}": {},
};

/** Maps an Examples cell to an env value: the word `unset` is an absent key, a quoted cell is its literal string. */
function envValueFromCell(cell: string): string | undefined {
  if (cell === UNSET_CELL) return undefined;
  const quoted = QUOTED_CELL.exec(cell);
  if (quoted === null) throw new Error(`Examples cell must be ${UNSET_CELL} or a quoted string, got: ${cell}`);
  return quoted[1];
}

function envFromCells(ci: string, vercel: string): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  const ciValue = envValueFromCell(ci);
  const vercelValue = envValueFromCell(vercel);
  if (ciValue !== undefined) env["CI"] = ciValue;
  if (vercelValue !== undefined) env["VERCEL"] = vercelValue;
  return env;
}

function evaluate(env: Record<string, string | undefined>): Readonly<{ options?: object; error?: unknown }> {
  try {
    return { options: buildWorkerOptions(env) };
  } catch (error: unknown) {
    return { error };
  }
}

describeFeature(feature, ({ ScenarioOutline }) => {
  ScenarioOutline("ayokoding-www build workers follow the environment", ({ Given, When, Then }, examples) => {
    const ci = String(examples["ci"] ?? "");
    const vercel = String(examples["vercel"] ?? "");
    const result = String(examples["result"] ?? "");
    let env: Record<string, string | undefined> = {};
    let outcome: ReturnType<typeof evaluate> = {};

    Given("the ayokoding-www build configuration", () => {
      env = {};
    });
    When("it is evaluated with CI <ci> and VERCEL <vercel>", () => {
      env = envFromCells(ci, vercel);
      outcome = evaluate(env);
    });
    Then("the experimental worker options are <result>", () => {
      const expected = RESULT_CELLS[result];
      expect(expected, `unknown result cell: ${result}`).toBeDefined();
      expect(outcome.error).toBeUndefined();
      expect(outcome.options).toStrictEqual(expected);
    });
  });

  ScenarioOutline("local build worker counts are validated", ({ Given, When, Then }, examples) => {
    const workers = String(examples["workers"] ?? "");
    const result = String(examples["result"] ?? "");
    let outcome: ReturnType<typeof evaluate> = {};

    Given("the ayokoding-www build configuration", () => {
      outcome = {};
    });
    When("it is evaluated with AYOKODING_WWW_BUILD_WORKERS <workers>", () => {
      const env: Record<string, string | undefined> = {};
      const workerValue = envValueFromCell(workers);
      if (workerValue !== undefined) env["AYOKODING_WWW_BUILD_WORKERS"] = workerValue;
      outcome = evaluate(env);
    });
    Then("the experimental worker options are <result>", () => {
      const expected = RESULT_CELLS[result];
      expect(expected, `unknown result cell: ${result}`).toBeDefined();
      expect(outcome.error).toBeUndefined();
      expect(outcome.options).toStrictEqual(expected);
    });
  });

  ScenarioOutline("deployment build workers ignore local overrides", ({ Given, When, Then }, examples) => {
    const platform = String(examples["platform"] ?? "");
    const workers = String(examples["workers"] ?? "");
    let outcome: ReturnType<typeof evaluate> = {};

    Given("the ayokoding-www build configuration", () => {
      outcome = {};
    });
    When("it is evaluated with <platform> and AYOKODING_WWW_BUILD_WORKERS <workers>", () => {
      const env: Record<string, string | undefined> = {};
      env[platform] = "true";
      const workerValue = envValueFromCell(workers);
      if (workerValue !== undefined) env["AYOKODING_WWW_BUILD_WORKERS"] = workerValue;
      outcome = evaluate(env);
    });
    Then("the experimental worker options are {}", () => {
      expect(outcome.error).toBeUndefined();
      expect(outcome.options).toStrictEqual({});
    });
  });

  ScenarioOutline("invalid local build worker counts fail safely", ({ Given, When, Then }, examples) => {
    const workers = String(examples["workers"] ?? "");
    let outcome: ReturnType<typeof evaluate> = {};

    Given("the ayokoding-www build configuration", () => {
      outcome = {};
    });
    When("it is evaluated with AYOKODING_WWW_BUILD_WORKERS <workers>", () => {
      const env: Record<string, string | undefined> = {};
      const workerValue = envValueFromCell(workers);
      if (workerValue !== undefined) env["AYOKODING_WWW_BUILD_WORKERS"] = workerValue;
      outcome = evaluate(env);
    });
    Then("the worker configuration error is sanitized", () => {
      expect(outcome.error).toBeInstanceOf(Error);
      expect(outcome.error).toHaveProperty("message", SANITIZED_WORKER_ERROR);
      expect(String(outcome.error)).not.toContain(JSON.stringify(workers.replaceAll('"', "")));
    });
  });
});
