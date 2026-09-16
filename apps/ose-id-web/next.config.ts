import "./src/env-loader.ts";
import "./src/env.ts";
import type { NextConfig } from "next";
import path from "node:path";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from "next/constants";
import { enforceRuntimeMode, processRuntimeModeHost } from "./src/shared/runtime/runtime-mode-guard";

// Next loads this module in its own top-level process before it binds a listener, which makes it
// the one place a startup invariant can refuse to serve and still be a startup invariant. Building
// is deliberately not guarded: producing a bundle serves nobody, and guarding it would make the
// production build itself impossible rather than the production *serve*.
const SERVING_PHASES: ReadonlySet<string> = new Set([PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER]);

// Two lockfiles are visible in the ancestor chain (this repository's own and each git worktree's
// copy), so Next's automatic root detection is ambiguous. Pin it explicitly.
const workspaceRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: [
    "@open-sharia-enterprise/web-ui",
    "@open-sharia-enterprise/web-ui-token",
    "@t3-oss/env-nextjs",
    "@t3-oss/env-core",
  ],
  images: {
    unoptimized: true,
  },
};

export default function nextConfigForPhase(phase: string): NextConfig {
  if (SERVING_PHASES.has(phase)) {
    enforceRuntimeMode(processRuntimeModeHost());
  }
  return nextConfig;
}
