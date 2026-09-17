/**
 * The process-facing half of the runtime-mode invariant. Every operating-system effect the guard
 * needs — reading the environment, writing a diagnostic, ending the process — arrives through
 * `RuntimeModeHost`, so the whole guard is exercised at Unit level without a real process.
 */
import { decideRuntimeMode, runtimeModeDiagnostic, type RuntimeMode } from "./runtime-mode";

export interface RuntimeModeHost {
  readonly environment: Readonly<Record<string, string | undefined>>;
  readonly writeDiagnostic: (line: string) => void;
  readonly exit: (code: number) => void;
}

/**
 * Enforces the invariant before anything binds a listener. On an unsupported mode it writes the
 * sanitized diagnostic, asks the host to exit non-zero, and returns `undefined` so a host that
 * cannot actually terminate still never receives a mode it may serve.
 */
export function enforceRuntimeMode(host: RuntimeModeHost): RuntimeMode | undefined {
  const decision = decideRuntimeMode(host.environment["OSE_RUNTIME_MODE"]);
  if (decision.allowed) {
    return decision.mode;
  }
  host.writeDiagnostic(runtimeModeDiagnostic());
  host.exit(1);
  return undefined;
}

/** The real process host. Kept separate from `enforceRuntimeMode` so tests never touch it. */
export function processRuntimeModeHost(): RuntimeModeHost {
  return {
    environment: process.env,
    writeDiagnostic: (line) => {
      process.stderr.write(`${line}\n`);
    },
    exit: (code) => {
      process.exit(code);
    },
  };
}
