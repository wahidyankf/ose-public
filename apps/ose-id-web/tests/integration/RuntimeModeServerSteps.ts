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
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import { expect, vi } from "vitest";
import { RUNTIME_MODE_DISABLED_CODE } from "../../src/shared/runtime/runtime-mode";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature"),
);

/** A backend origin configured on every run, so a start that reached it would have somewhere real to go. */
const BACKEND_ORIGIN = "http://127.0.0.1:8501";

const { default: nextConfigForPhase } = await import("../../next.config");

describeFeature(feature, ({ Rule }) => {
  Rule("Web serving is disabled outside Local or Test", ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      "Reject an unsupported service runtime before listener binding",
      ({ Given, When, Then, And }, variables) => {
        const exitCodes: number[] = [];
        const diagnostics: string[] = [];
        let requestsAttempted = 0;

        /** Runs one Next phase with the mode under test, observing exit, stderr, and the network. */
        function runPhase(phase: string): { readonly exitCodes: number[]; readonly diagnostics: string[] } {
          const phaseExits: number[] = [];
          const phaseDiagnostics: string[] = [];
          const mode = String(variables["mode"]);
          const previousMode = process.env["OSE_RUNTIME_MODE"];
          const previousBackendOrigin = process.env["OSE_ID_BE_URL"];
          process.env["OSE_ID_BE_URL"] = BACKEND_ORIGIN;
          if (mode === "missing") {
            delete process.env["OSE_RUNTIME_MODE"];
          } else {
            process.env["OSE_RUNTIME_MODE"] = mode;
          }

          const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
            phaseExits.push(code ?? 0);
          }) as never);
          const write = vi.spyOn(process.stderr, "write").mockImplementation(((chunk: string) => {
            phaseDiagnostics.push(String(chunk));
            return true;
          }) as never);
          const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((() => {
            requestsAttempted += 1;
            throw new Error("the runtime-mode guard must reach no network");
          }) as never);
          try {
            nextConfigForPhase(phase);
          } finally {
            exit.mockRestore();
            write.mockRestore();
            fetchSpy.mockRestore();
            if (previousMode === undefined) {
              delete process.env["OSE_RUNTIME_MODE"];
            } else {
              process.env["OSE_RUNTIME_MODE"] = previousMode;
            }
            if (previousBackendOrigin === undefined) {
              delete process.env["OSE_ID_BE_URL"];
            } else {
              process.env["OSE_ID_BE_URL"] = previousBackendOrigin;
            }
          }
          return { exitCodes: phaseExits, diagnostics: phaseDiagnostics };
        }

        Given("the web runtime mode is <mode>", () => {
          exitCodes.length = 0;
          diagnostics.length = 0;
          requestsAttempted = 0;
        });

        When("the web process starts", () => {
          const observed = runPhase(PHASE_PRODUCTION_SERVER);
          exitCodes.push(...observed.exitCodes);
          diagnostics.push(...observed.diagnostics);
        });

        Then("startup exits non-zero before serving the application", () => {
          expect(exitCodes).toEqual([1]);
        });

        And("the diagnostic returns the stable runtime-mode-disabled code", () => {
          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0]).toContain(RUNTIME_MODE_DISABLED_CODE);
        });

        And("no configured listener is bound", () => {
          // The guard is bound to the phases in which Next binds a listener, and to no other:
          // the same rejected mode passes the build phase untouched, which is what makes the
          // refusal a serving guard rather than a blanket failure.
          const building = runPhase(PHASE_PRODUCTION_BUILD);

          expect(building.exitCodes).toEqual([]);
          expect(building.diagnostics).toEqual([]);
          expect(exitCodes).toEqual([1]);
        });

        And("no request reaches the identity service", () => {
          // The shell owns no store; the only way a start could change an identity record is by
          // calling the backend, and the refused start called nothing at all.
          expect(requestsAttempted).toBe(0);
        });

        And("the diagnostic discloses no secret, configuration value, stack trace, or absolute path", () => {
          const diagnostic = diagnostics[0] ?? "";

          expect(diagnostic).not.toContain(String(variables["mode"]));
          expect(diagnostic).not.toContain(BACKEND_ORIGIN);
          expect(diagnostic).not.toContain("OSE_ID_BE_URL");
          expect(diagnostic).not.toContain("=");
          expect(diagnostic).not.toContain(process.cwd());
          expect(diagnostic).not.toMatch(/\bat\s+\S+\s+\(/u);
        });
      },
    );
  });
});
