import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Shape validation only. Whether a runtime mode is one this unfinished shell may serve in is a
 * startup policy decision, not a schema one, and belongs to the runtime-mode guard — declaring the
 * mode required here would instead fail the production build, which is the wrong surface.
 */
export const env = createEnv({
  server: {
    OSE_RUNTIME_MODE: z.string().optional(),
    OSE_ID_WEB_PORT: z.string().optional(),
  },
  experimental__runtimeEnv: {},
});
