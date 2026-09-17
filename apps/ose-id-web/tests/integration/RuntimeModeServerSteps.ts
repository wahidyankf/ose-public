/**
 * Integration bindings for specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature.
 *
 * The Integration adapter drives the real Next.js configuration entry — the module Next loads
 * before it binds a listener — with controlled configuration and no network. Only the two
 * operating-system effects the assertion is about, process exit and the diagnostic stream, are
 * observed rather than performed.
 */
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { PHASE_PRODUCTION_SERVER } from "next/constants";
import { expect, vi } from "vitest";
import { RUNTIME_MODE_DISABLED_CODE } from "../../src/shared/runtime/runtime-mode";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature"),
);

const { default: nextConfigForPhase } = await import("../../next.config");

describeFeature(feature, ({ Rule }) => {
  Rule("Web serving is disabled outside Local or Test", ({ RuleScenarioOutline }) => {
    RuleScenarioOutline("Reject an unsupported web runtime mode", ({ Given, When, Then, And }, variables) => {
      const exitCodes: number[] = [];
      const diagnostics: string[] = [];
      let previousMode: string | undefined;

      Given("the web runtime mode is <mode>", () => {
        previousMode = process.env["OSE_RUNTIME_MODE"];
        const mode = String(variables["mode"]);
        if (mode === "missing") {
          delete process.env["OSE_RUNTIME_MODE"];
        } else {
          process.env["OSE_RUNTIME_MODE"] = mode;
        }
      });

      When("the web process starts", () => {
        const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
          exitCodes.push(code ?? 0);
        }) as never);
        const write = vi.spyOn(process.stderr, "write").mockImplementation(((chunk: string) => {
          diagnostics.push(String(chunk));
          return true;
        }) as never);
        try {
          nextConfigForPhase(PHASE_PRODUCTION_SERVER);
        } finally {
          exit.mockRestore();
          write.mockRestore();
          if (previousMode === undefined) {
            delete process.env["OSE_RUNTIME_MODE"];
          } else {
            process.env["OSE_RUNTIME_MODE"] = previousMode;
          }
        }
      });

      Then("startup exits non-zero before serving the application", () => {
        expect(exitCodes).toEqual([1]);
      });

      And("the diagnostic returns the stable runtime-mode-disabled code", () => {
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]).toContain(RUNTIME_MODE_DISABLED_CODE);
        expect(diagnostics[0]).not.toContain(String(variables["mode"]));
        expect(diagnostics[0]).not.toMatch(/\bat\s+\S+\s+\(/u);
      });
    });
  });
});
