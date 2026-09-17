/**
 * Unit bindings for specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature.
 *
 * The Unit adapter replaces the operating-system boundary — the process environment, the standard
 * error stream, and process termination — with an injected host, so every mode branch of the guard
 * is decided here without starting a server.
 */
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  RUNTIME_MODE_DISABLED_CODE,
  decideRuntimeMode,
  runtimeModeDiagnostic,
} from "../../src/shared/runtime/runtime-mode";
import { enforceRuntimeMode, type RuntimeModeHost } from "../../src/shared/runtime/runtime-mode-guard";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature"),
);

/** `missing` in the Examples table means the variable is absent, not the literal word. */
function environmentForMode(mode: string): Record<string, string | undefined> {
  return mode === "missing" ? {} : { OSE_RUNTIME_MODE: mode };
}

describeFeature(feature, ({ Rule }) => {
  Rule("Web serving is disabled outside Local or Test", ({ RuleScenarioOutline }) => {
    RuleScenarioOutline("Reject an unsupported web runtime mode", ({ Given, When, Then, And }, variables) => {
      let environment: Record<string, string | undefined> = {};
      const diagnostics: string[] = [];
      const exitCodes: number[] = [];
      let admittedMode: string | undefined;

      Given("the web runtime mode is <mode>", () => {
        environment = environmentForMode(String(variables["mode"]));
      });

      When("the web process starts", () => {
        const host: RuntimeModeHost = {
          environment,
          writeDiagnostic: (line) => {
            diagnostics.push(line);
          },
          exit: (code) => {
            exitCodes.push(code);
          },
        };
        admittedMode = enforceRuntimeMode(host);
      });

      Then("startup exits non-zero before serving the application", () => {
        expect(decideRuntimeMode(environment["OSE_RUNTIME_MODE"]).allowed).toBe(false);
        expect(exitCodes).toEqual([1]);
        expect(admittedMode).toBeUndefined();
      });

      And("the diagnostic returns the stable runtime-mode-disabled code", () => {
        expect(diagnostics).toEqual([runtimeModeDiagnostic()]);
        const diagnostic = diagnostics[0] ?? "";
        expect(diagnostic).toContain(RUNTIME_MODE_DISABLED_CODE);
        // Sanitized: the rejected value, the environment, machine paths, and stacks stay out.
        expect(diagnostic).not.toContain(String(variables["mode"]));
        expect(diagnostic).not.toMatch(/\//u);
        expect(diagnostic).not.toContain("Error");
        expect(diagnostic.split("\n")).toHaveLength(1);
      });
    });
  });
});
