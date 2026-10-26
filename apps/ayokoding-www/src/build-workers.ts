/**
 * Caps the Next.js build worker count outside CI and Vercel.
 *
 * Next treats a non-default `experimental.cpus` as a user override of its worker count, so the cap
 * is returned only for a local build; CI and Vercel get `{}` and keep Next's default. An empty
 * value counts as unset. Local builds default to two workers and may select one or two explicitly.
 */

/** Default worker count for a local build when no override is supplied. */
const DEFAULT_LOCAL_BUILD_WORKERS = 2;
/** Environment variable that selects the local build worker count. */
const BUILD_WORKERS_ENV = "AYOKODING_WWW_BUILD_WORKERS";
/** Sanitized configuration error that deliberately excludes the supplied environment value. */
const INVALID_BUILD_WORKERS_MESSAGE = `${BUILD_WORKERS_ENV} must be 1 or 2 when set.`;

/** The part of the process environment this module reads. */
export type BuildWorkerEnv = Readonly<Record<string, string | undefined>>;

/** The `experimental` options this module contributes to the Next.js config. */
export type BuildWorkerOptions = Readonly<{ cpus?: number }>;

function isSet(value: string | undefined): boolean {
  return value !== undefined && value !== "";
}

function localBuildWorkers(value: string | undefined): number {
  if (!isSet(value)) return DEFAULT_LOCAL_BUILD_WORKERS;
  if (value === "1") return 1;
  if (value === "2") return 2;
  throw new Error(INVALID_BUILD_WORKERS_MESSAGE);
}

/** Returns the local worker cap or `{}` when `CI` or `VERCEL` is set. */
export function buildWorkerOptions(env: BuildWorkerEnv): BuildWorkerOptions {
  if (isSet(env["CI"]) || isSet(env["VERCEL"])) return {};
  return { cpus: localBuildWorkers(env[BUILD_WORKERS_ENV]) };
}
