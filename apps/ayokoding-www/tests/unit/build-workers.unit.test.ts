import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, it } from "vitest";
import { buildWorkerOptions } from "../../src/build-workers";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature",
  ),
);

const UNSET_CELL = "unset";
const QUOTED_CELL = /^"(.*)"$/;

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

describeFeature(feature, ({ ScenarioOutline }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature: A local build uses two workers while CI and Vercel builds keep the default worker count
  ScenarioOutline(
    "A local build uses two workers while CI and Vercel builds keep the default worker count",
    ({ Given, When, Then }, examples) => {
      const ci = String(examples["ci"] ?? "");
      const vercel = String(examples["vercel"] ?? "");
      const result = String(examples["result"] ?? "");
      let env: Record<string, string | undefined> = {};
      let options: object = {};

      Given("the ayokoding-www build configuration", () => {
        env = {};
      });
      When("it is evaluated with CI <ci>, VERCEL <vercel>, and worker override <workers>", () => {
        env = envFromCells(ci, vercel);
        env["AYOKODING_WWW_BUILD_WORKERS"] = envValueFromCell(String(examples["workers"]));
        options = buildWorkerOptions(env);
      });
      Then("the experimental worker options are <result>", () => {
        const expected = RESULT_CELLS[result];
        expect(expected, `unknown result cell: ${result}`).toBeDefined();
        expect(options).toStrictEqual(expected);
      });
    },
  );
  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature: A local build accepts AYOKODING_WWW_BUILD_WORKERS of 1 or 2
  ScenarioOutline("A local build accepts AYOKODING_WWW_BUILD_WORKERS of 1 or 2", ({ Given, When, Then }, examples) => {
    let options: object = {};
    Given("the ayokoding-www build configuration", () => {
      options = {};
    });
    When("it is evaluated locally with worker override <workers>", () => {
      options = buildWorkerOptions({ AYOKODING_WWW_BUILD_WORKERS: envValueFromCell(String(examples["workers"])) });
    });
    Then("the experimental worker options are <result>", () => {
      const expected = RESULT_CELLS[String(examples["result"])];
      expect(expected).toBeDefined();
      expect(options).toStrictEqual(expected);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature: A local build fails with a message naming AYOKODING_WWW_BUILD_WORKERS when its value is not 1 or 2
  ScenarioOutline(
    "A local build fails with a message naming AYOKODING_WWW_BUILD_WORKERS when its value is not 1 or 2",
    ({ Given, When, Then }, examples) => {
      let failure: unknown;
      Given("the ayokoding-www build configuration", () => {
        failure = undefined;
      });
      When("it is evaluated locally with worker override <workers>", () => {
        try {
          buildWorkerOptions({ AYOKODING_WWW_BUILD_WORKERS: envValueFromCell(String(examples["workers"])) });
        } catch (error: unknown) {
          failure = error;
        }
      });
      Then("the build configuration fails with a message naming AYOKODING_WWW_BUILD_WORKERS", () => {
        expect(failure).toBeInstanceOf(Error);
        if (!(failure instanceof Error)) throw new Error("Expected worker override validation error");
        expect(failure.message).toContain("AYOKODING_WWW_BUILD_WORKERS");
      });
    },
  );
});

// Plain test (no scenario): the purity property is internal, so the feature no longer carries it.
it("evaluating a local build leaves the supplied environment unchanged", () => {
  const env = Object.freeze({ CI: "", VERCEL: "", AYOKODING_WWW_BUILD_WORKERS: "" });
  const options = buildWorkerOptions(env);
  expect(options).toStrictEqual({ cpus: 2 });
  expect(env).toStrictEqual({ CI: "", VERCEL: "", AYOKODING_WWW_BUILD_WORKERS: "" });
});
