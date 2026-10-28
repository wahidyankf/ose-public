import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Caps the Next.js build worker count outside CI and Vercel.
 *
 * Next treats a non-default `experimental.cpus` as a user override of its worker count, so the cap
 * is returned only for a local build; CI and Vercel get `{}` and keep Next's default. An empty
 * value counts as unset.
 */

/** Worker count a local build is capped to, so the machine stays responsive during `next build`. */
const LOCAL_BUILD_WORKERS = 2;

/** The part of the process environment this module reads. */
export type BuildWorkerEnv = Readonly<Record<string, string | undefined>>;

/** The `experimental` options this module contributes to the Next.js config. */
export type BuildWorkerOptions = Readonly<{ cpus?: number }>;

function isSet(value: string | undefined): boolean {
  return value !== undefined && value !== "";
}

/** Selects the local worker cap, or leaves it to Next in CI and Vercel. */
export function buildWorkerOptions(env: BuildWorkerEnv): BuildWorkerOptions {
  if (isSet(env["CI"]) || isSet(env["VERCEL"])) return {};
  const validated = createEnv({
    server: {
      AYOKODING_WWW_BUILD_WORKERS: z.enum(["1", "2"]).optional(),
    },
    runtimeEnv: {
      AYOKODING_WWW_BUILD_WORKERS: env["AYOKODING_WWW_BUILD_WORKERS"],
    },
    emptyStringAsUndefined: true,
    isServer: true,
    onValidationError: () => {
      throw new Error("AYOKODING_WWW_BUILD_WORKERS must be 1 or 2");
    },
  });
  return { cpus: validated.AYOKODING_WWW_BUILD_WORKERS === "1" ? 1 : LOCAL_BUILD_WORKERS };
}
