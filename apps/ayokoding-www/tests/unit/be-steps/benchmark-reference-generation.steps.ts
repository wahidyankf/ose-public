import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { substituteMarkers, type GeneratedTables } from "../../../src/scripts/generate-benchmark-reference";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/build-tools/benchmark-reference-generation/benchmark-reference-generation.feature",
  ),
);

/**
 * A canonical generated roster block — the same `\n\n<body>\n\n` shape `renderTables` emits via
 * the `block()` helper. Reused across scenarios so the assertions mirror the real generator output.
 */
const ROSTER_TABLE = "\n\n| Model ID | Display Name |\n| --- | --- |\n| opencode-go/x | Example |\n\n";

/**
 * Mirrors the `--validate` drift decision in `generate-benchmark-reference.ts`'s `main()` shell
 * (regenerate in memory, exit non-zero iff the result differs from the original) WITHOUT touching
 * the filesystem — the unit tests exercise the pure functions only, per the test-file header.
 */
function validateWouldExitNonZero(original: string, tables: GeneratedTables): boolean {
  return substituteMarkers(original, tables) !== original;
}

describeFeature(feature, ({ Scenario, Background }) => {
  // Per-scenario state. Reset in the Background (which runs before every scenario) so a prior
  // scenario's result never leaks into the next one.
  let doc: string;
  let tables: GeneratedTables;
  let output: string;
  let firstRunOutput: string;
  let caughtError: unknown;
  let validateDrifted: boolean;

  Background(({ Given }) => {
    Given("a reference document with a roster generated block containing stale inner content", () => {
      doc = [
        "Lead-in prose that must survive generation.",
        "",
        "<!-- BEGIN GENERATED: roster -->",
        "STALE old roster content that must be replaced.",
        "<!-- END GENERATED: roster -->",
        "",
        "Trailing prose that must also survive.",
        "",
      ].join("\n");
      tables = { roster: ROSTER_TABLE };
      output = "";
      firstRunOutput = "";
      caughtError = undefined;
      validateDrifted = false;
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/benchmark-reference-generation/benchmark-reference-generation.feature: Generating the benchmark reference refreshes its generated tables and leaves the rest of the page as written
  Scenario(
    "Generating the benchmark reference refreshes its generated tables and leaves the rest of the page as written",
    ({ When, Then, And }) => {
      When("the benchmark reference generator runs in generate mode", () => {
        try {
          output = substituteMarkers(doc, tables);
        } catch (e) {
          caughtError = e;
        }
      });

      Then("the stale inner text should be replaced by the generated block", () => {
        expect(caughtError).toBeUndefined();
        expect(output).toContain("opencode-go/x");
        expect(output).not.toContain("STALE old roster content");
      });

      And("the lead-in and trailing prose should be unchanged", () => {
        expect(output.startsWith("Lead-in prose that must survive generation.")).toBe(true);
        expect(output).toContain("Trailing prose that must also survive.");
      });

      And("the BEGIN and END marker tags should remain in place", () => {
        expect(output).toContain("<!-- BEGIN GENERATED: roster -->");
        expect(output).toContain("<!-- END GENERATED: roster -->");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/benchmark-reference-generation/benchmark-reference-generation.feature: Generating from a page whose generated block is never closed fails with an error naming the block
  Scenario(
    "Generating from a page whose generated block is never closed fails with an error naming the block",
    ({ Given, When, Then }) => {
      Given("a reference document whose roster block has a BEGIN marker but no END marker", () => {
        doc = ["<!-- BEGIN GENERATED: roster -->", "this pair is never closed", "more trailing content", ""].join("\n");
        tables = { roster: ROSTER_TABLE };
      });

      When("the benchmark reference generator runs in generate mode", () => {
        try {
          output = substituteMarkers(doc, tables);
        } catch (e) {
          caughtError = e;
        }
      });

      Then("it should throw an error naming the unclosed roster marker", () => {
        expect(caughtError).toBeInstanceOf(Error);
        expect(String((caughtError as Error)?.message ?? caughtError)).toMatch(/roster/);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/benchmark-reference-generation/benchmark-reference-generation.feature: Generate mode is idempotent
  Scenario("Generate mode is idempotent", ({ When, Then }) => {
    When("the benchmark reference generator runs twice in generate mode", () => {
      firstRunOutput = substituteMarkers(doc, tables);
      output = substituteMarkers(firstRunOutput, tables);
    });

    Then("the two outputs should be byte-identical with no duplicated content", () => {
      expect(output).toBe(firstRunOutput);
      // Exactly one rendered row — a second pass must not duplicate the generated block.
      expect(output.split("opencode-go/x").length).toBe(2);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/build-tools/benchmark-reference-generation/benchmark-reference-generation.feature: Validate mode exits non-zero on drift
  Scenario("Validate mode exits non-zero on drift", ({ When, Then }) => {
    When("the benchmark reference generator runs in validate mode", () => {
      validateDrifted = validateWouldExitNonZero(doc, tables);
    });

    Then("it should detect drift and signal a non-zero exit", () => {
      // The Background doc carries stale inner content, so regeneration differs from the
      // original — the exact condition `main()` uses to call `process.exit(1)`.
      expect(validateDrifted).toBe(true);
    });
  });
});
