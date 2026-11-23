import { spawnSync } from "node:child_process";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature",
  ),
);

/** The tsx command-line entry, so the child can import the TypeScript module without a build. */
const TSX_CLI = path.resolve(process.cwd(), "../../node_modules/tsx/dist/cli.mjs");

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

/**
 * Evaluates the real worker-cap module in a child Node process whose environment holds exactly the
 * given variables. That is the same read the Next.js config makes when a build starts, with the
 * process environment supplied by the operating system rather than a test double.
 */
function evaluateInChildProcess(env: Record<string, string | undefined>): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const childEnv: Record<string, string> = { PATH: process.env["PATH"] ?? "" };
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) childEnv[key] = value;
  }
  const script =
    "import { buildWorkerOptions } from './src/build-workers.ts';" +
    "process.stdout.write(JSON.stringify(buildWorkerOptions(process.env)));";
  const result = spawnSync(process.execPath, [TSX_CLI, "--eval", script], {
    cwd: process.cwd(),
    // Next's global typing requires NODE_ENV on ProcessEnv. The child is pinned to "test", the value the runner sets.
    env: { ...childEnv, NODE_ENV: "test" },
    encoding: "utf8",
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describeFeature(feature, ({ ScenarioOutline }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature: A local build uses two workers while CI and Vercel builds keep the default worker count
  ScenarioOutline(
    "A local build uses two workers while CI and Vercel builds keep the default worker count",
    ({ Given, When, Then }, examples) => {
      let options: unknown;

      Given("the ayokoding-www build configuration", () => {
        options = undefined;
      });
      When("it is evaluated with CI <ci>, VERCEL <vercel>, and worker override <workers>", () => {
        const run = evaluateInChildProcess({
          CI: envValueFromCell(String(examples["ci"])),
          VERCEL: envValueFromCell(String(examples["vercel"])),
          AYOKODING_WWW_BUILD_WORKERS: envValueFromCell(String(examples["workers"])),
        });
        expect(run.status, run.stderr).toBe(0);
        options = JSON.parse(run.stdout);
      });
      Then("the experimental worker options are <result>", () => {
        expect(options).toStrictEqual(RESULT_CELLS[String(examples["result"])]);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature: A local build accepts AYOKODING_WWW_BUILD_WORKERS of 1 or 2
  ScenarioOutline("A local build accepts AYOKODING_WWW_BUILD_WORKERS of 1 or 2", ({ Given, When, Then }, examples) => {
    let options: unknown;

    Given("the ayokoding-www build configuration", () => {
      options = undefined;
    });
    When("it is evaluated locally with worker override <workers>", () => {
      const run = evaluateInChildProcess({
        AYOKODING_WWW_BUILD_WORKERS: envValueFromCell(String(examples["workers"])),
      });
      expect(run.status, run.stderr).toBe(0);
      options = JSON.parse(run.stdout);
    });
    Then("the experimental worker options are <result>", () => {
      expect(options).toStrictEqual(RESULT_CELLS[String(examples["result"])]);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/build-workers/build-workers.feature: A local build fails with a message naming AYOKODING_WWW_BUILD_WORKERS when its value is not 1 or 2
  ScenarioOutline(
    "A local build fails with a message naming AYOKODING_WWW_BUILD_WORKERS when its value is not 1 or 2",
    ({ Given, When, Then }, examples) => {
      let run: ReturnType<typeof evaluateInChildProcess> | undefined;

      Given("the ayokoding-www build configuration", () => {
        run = undefined;
      });
      When("it is evaluated locally with worker override <workers>", () => {
        run = evaluateInChildProcess({
          AYOKODING_WWW_BUILD_WORKERS: envValueFromCell(String(examples["workers"])),
        });
      });
      Then("the build configuration fails with a message naming AYOKODING_WWW_BUILD_WORKERS", () => {
        expect(run?.status).not.toBe(0);
        expect(run?.stderr).toContain("AYOKODING_WWW_BUILD_WORKERS");
      });
    },
  );
});
