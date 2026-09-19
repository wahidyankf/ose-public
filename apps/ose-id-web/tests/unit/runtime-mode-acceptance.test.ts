/**
 * The allowed half of the runtime-mode invariant. The Gherkin corpus only enumerates rejections,
 * so the accepting branches are proven here: a guard that rejected everything would satisfy the
 * feature file and still be wrong.
 */
import { describe, expect, it, vi } from "vitest";
import { SUPPORTED_RUNTIME_MODES, decideRuntimeMode } from "../../src/shared/runtime/runtime-mode";
import { enforceRuntimeMode, processRuntimeModeHost } from "../../src/shared/runtime/runtime-mode-guard";

describe("runtime mode acceptance", () => {
  it.each([...SUPPORTED_RUNTIME_MODES])("admits %s", (mode) => {
    expect(decideRuntimeMode(mode)).toEqual({ allowed: true, mode });
  });

  it.each([...SUPPORTED_RUNTIME_MODES])("serves in %s without writing a diagnostic or exiting", (mode) => {
    const diagnostics: string[] = [];
    const exitCodes: number[] = [];

    const admitted = enforceRuntimeMode({
      environment: { OSE_RUNTIME_MODE: mode },
      writeDiagnostic: (line) => {
        diagnostics.push(line);
      },
      exit: (code) => {
        exitCodes.push(code);
      },
    });

    expect(admitted).toBe(mode);
    expect(diagnostics).toEqual([]);
    expect(exitCodes).toEqual([]);
  });

  it.each(["local", "LOCAL", "test", "Development", "", " Local"])("rejects the near-miss value %o", (mode) => {
    expect(decideRuntimeMode(mode).allowed).toBe(false);
  });

  it("exposes exactly Local and Test as supported modes", () => {
    expect([...SUPPORTED_RUNTIME_MODES]).toEqual(["Local", "Test"]);
  });

  it("reads the real process environment through the process host", () => {
    const host = processRuntimeModeHost();
    expect(host.environment).toBe(process.env);
    expect(typeof host.writeDiagnostic).toBe("function");
    expect(typeof host.exit).toBe("function");
  });

  it("sends the diagnostic to standard error and the exit code to the process", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

    const host = processRuntimeModeHost();
    host.writeDiagnostic("a sanitized diagnostic");
    host.exit(1);

    expect(write).toHaveBeenCalledWith("a sanitized diagnostic\n");
    expect(exit).toHaveBeenCalledWith(1);

    write.mockRestore();
    exit.mockRestore();
  });
});
