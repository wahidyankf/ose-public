/**
 * The startup invariant that keeps OSE ID's web shell out of every environment it is not finished
 * for. This module is deliberately pure: it decides, it never exits, logs, or reads the process.
 *
 * See `specs/apps/ose/id-web/architecture/runtime-guard-and-status-reporting.md`.
 */

/** The stable diagnostic code a rejected startup emits. Runners match on this exact string. */
export const RUNTIME_MODE_DISABLED_CODE = "runtime_mode_disabled";

/** The environment variable both OSE ID processes read for their runtime mode. */
export const RUNTIME_MODE_VARIABLE = "OSE_RUNTIME_MODE";

/** The only two modes the unfinished OSE ID web shell may serve in. */
export const SUPPORTED_RUNTIME_MODES = ["Local", "Test"] as const;

export type RuntimeMode = (typeof SUPPORTED_RUNTIME_MODES)[number];

export type RuntimeModeDecision =
  | { readonly allowed: true; readonly mode: RuntimeMode }
  | { readonly allowed: false; readonly diagnosticCode: typeof RUNTIME_MODE_DISABLED_CODE };

function isSupported(value: string): value is RuntimeMode {
  return (SUPPORTED_RUNTIME_MODES as readonly string[]).includes(value);
}

/**
 * Decides whether a raw runtime-mode value may serve. Missing, blank, unknown, and every
 * production-like value fail closed; there is no bypass value and no second opinion.
 *
 * The comparison is exact and case-sensitive on purpose: accepting `local` or `LOCAL` would mean
 * accepting a value nobody wrote deliberately, which is how a production deployment slips through.
 */
export function decideRuntimeMode(rawMode: string | undefined): RuntimeModeDecision {
  if (rawMode !== undefined && isSupported(rawMode)) {
    return { allowed: true, mode: rawMode };
  }
  return { allowed: false, diagnosticCode: RUNTIME_MODE_DISABLED_CODE };
}

/**
 * The one-line diagnostic a rejected startup writes. It names the code and the supported modes and
 * nothing else — no rejected value, no environment dump, no path, no stack.
 */
export function runtimeModeDiagnostic(): string {
  return (
    `${RUNTIME_MODE_DISABLED_CODE}: the OSE ID web shell serves only in ` +
    `${SUPPORTED_RUNTIME_MODES.join(" or ")} mode and refused to start.`
  );
}
