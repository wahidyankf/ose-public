/**
 * Wired as the very first import in `next.config.ts`, before `./env.ts`, so every other config
 * module — including `./env.ts`'s `createEnv()` validation and the runtime-mode guard — observes
 * the tier file's values.
 *
 * The loader logic (tier resolution, stray-file guard, process-env-wins application) lives in
 * `@open-sharia-enterprise/ts-env-loader`, shared across every Next.js app in this repository. A
 * shared library never loads its own tier file on import, so each app makes the call itself.
 */
import { loadTierEnv } from "@open-sharia-enterprise/ts-env-loader";

export { loadTierEnv, resolveTier, tierEnvFilePath } from "@open-sharia-enterprise/ts-env-loader";

loadTierEnv();
