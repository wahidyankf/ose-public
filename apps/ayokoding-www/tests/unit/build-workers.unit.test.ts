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

const RESULT_CELLS: Readonly<Record<string, Readonly<{ cpus?: number }>>> = {
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
  ScenarioOutline("ayokoding-www build workers follow the environment", ({ Given, When, Then }, examples) => {
    const ci = String(examples["ci"] ?? "");
    const vercel = String(examples["vercel"] ?? "");
    const result = String(examples["result"] ?? "");
    let env: Record<string, string | undefined> = {};
    let options: object = {};

    Given("the ayokoding-www build configuration", () => {
      env = {};
    });
    When("it is evaluated with CI <ci> and VERCEL <vercel>", () => {
      env = envFromCells(ci, vercel);
      options = buildWorkerOptions(env);
    });
    Then("the experimental worker options are <result>", () => {
      const expected = RESULT_CELLS[result];
      expect(expected, `unknown result cell: ${result}`).toBeDefined();
      expect(options).toStrictEqual(expected);
    });
  });
});
