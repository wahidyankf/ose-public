/**
 * Unit bindings for specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature.
 *
 * The Unit adapter replaces the operating-system boundary — the process environment, the standard
 * error stream, and process termination — with an injected host, so every mode branch of the guard
 * is decided here without starting a server.
 */
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
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
    RuleScenarioOutline(
      "Reject an unsupported service runtime before listener binding",
      ({ Given, When, Then, And }, variables) => {
        let environment: Record<string, string | undefined> = {};
        const diagnostics: string[] = [];
        const exitCodes: number[] = [];
        let host: RuntimeModeHost | undefined;
        let admittedMode: string | undefined;
        let requestsAttempted = 0;

        Given("the web runtime mode is <mode>", () => {
          // A backend origin is configured on every run, so a guard that reached the identity
          // service would have somewhere real to reach; refusing before that is the claim.
          environment = { ...environmentForMode(String(variables["mode"])), OSE_ID_BE_URL: "http://127.0.0.1:8501" };
        });

        When("the web process starts", () => {
          const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((() => {
            requestsAttempted += 1;
            throw new Error("the runtime-mode guard must reach no network");
          }) as never);
          host = {
            environment,
            writeDiagnostic: (line) => {
              diagnostics.push(line);
            },
            exit: (code) => {
              exitCodes.push(code);
            },
          };
          try {
            admittedMode = enforceRuntimeMode(host);
          } finally {
            fetchSpy.mockRestore();
          }
        });

        Then("startup exits non-zero before serving the application", () => {
          expect(decideRuntimeMode(environment["OSE_RUNTIME_MODE"]).allowed).toBe(false);
          expect(exitCodes).toEqual([1]);
          expect(admittedMode).toBeUndefined();
        });

        And("the diagnostic returns the stable runtime-mode-disabled code", () => {
          expect(diagnostics).toEqual([runtimeModeDiagnostic()]);
          expect(diagnostics[0]).toContain(RUNTIME_MODE_DISABLED_CODE);
        });

        And("no configured listener is bound", () => {
          // `enforceRuntimeMode` returns the mode a caller may serve in, and a refusal returns
          // nothing, so the caller is left with no mode to start a server for.
          expect(admittedMode).toBeUndefined();

          // And the guard could not have started one: its whole host contract is these three
          // members, none of which can open a socket.
          expect(Object.keys(host ?? {}).toSorted()).toEqual(["environment", "exit", "writeDiagnostic"]);
        });

        And("no request reaches the identity service", () => {
          // The shell owns no store; the only way a start could change an identity record is by
          // calling the backend, and the refused start called nothing at all.
          expect(requestsAttempted).toBe(0);
        });

        And("the diagnostic discloses no secret, configuration value, stack trace, or absolute path", () => {
          const diagnostic = diagnostics[0] ?? "";

          // Neither the rejected mode nor any other configured value comes back out.
          expect(diagnostic).not.toContain(String(variables["mode"]));
          expect(diagnostic).not.toContain("OSE_ID_BE_URL");
          expect(diagnostic).not.toContain("8501");
          expect(diagnostic).not.toContain("=");

          // Nor a path or a stack frame: the message is one sentence of fixed policy text.
          expect(diagnostic).not.toMatch(/\//u);
          expect(diagnostic).not.toMatch(/\\/u);
          expect(diagnostic).not.toContain("Error");
          expect(diagnostic).not.toMatch(/\bat\s+\S+\s+\(/u);
          expect(diagnostic.split("\n")).toHaveLength(1);
        });
      },
    );
  });
});
