import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** The registered local default for `ose-id-be`, matching the reserved backend port. */
const DEFAULT_OSE_ID_BE_URL = "http://127.0.0.1:8501";

/**
 * The only hosts this shell may be pointed at. The shell serves in Local and Test alone, so a
 * backend origin that is not loopback is a misconfiguration worth refusing at startup rather than
 * a deployment this build supports — and refusing it here is what stops a local page from reading,
 * and then reporting on, somebody's real environment.
 */
const LOOPBACK_HOSTNAMES: ReadonlySet<string> = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/**
 * Shape validation only for the runtime mode: whether a mode is one this unfinished shell may serve
 * in is a startup policy decision, not a schema one, and belongs to the runtime-mode guard —
 * declaring the mode required here would instead fail the production build, which is the wrong
 * surface.
 *
 * `OSE_ID_BE_URL` is server-only and never exposed to the browser. The browser must not learn the
 * backend origin: the readiness read happens inside the server render, and the shell publishes no
 * health route of its own for anything downstream to probe the backend through.
 */
export const env = createEnv({
  server: {
    OSE_RUNTIME_MODE: z.string().optional(),
    OSE_ID_WEB_PORT: z.string().optional(),
    OSE_ID_BE_URL: z
      .url()
      .refine((value) => LOOPBACK_HOSTNAMES.has(new URL(value).hostname), {
        message: "must be an absolute loopback origin",
      })
      .default(DEFAULT_OSE_ID_BE_URL),
  },
  experimental__runtimeEnv: {},
});
