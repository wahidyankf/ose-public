/**
 * Chooses whether the Next.js build emits its standalone bundle.
 *
 * Standalone output stays on by default, so the production, Dockerfile, and CI deploy builds are unchanged. Only the
 * integration build sets `AYOKODING_WWW_STANDALONE_OUTPUT=off`, because its scenario reads only the prerender manifest
 * and the standalone bundle costs about 7 GB of disk. Any value other than exactly `off` keeps standalone output.
 */

/** The part of the process environment this module reads. */
export type BuildOutputEnv = Readonly<Record<string, string | undefined>>;

/** Returns `"standalone"`, or `undefined` only when the switch is exactly `off`. */
export function standaloneOutputFromEnv(env: BuildOutputEnv): "standalone" | undefined {
  return env["AYOKODING_WWW_STANDALONE_OUTPUT"] === "off" ? undefined : "standalone";
}
