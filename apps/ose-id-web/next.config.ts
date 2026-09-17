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
  // The local-stack runner (apps/ose-id-be-e2e/scripts/local-stack.mjs) may build and serve two
  // independent runs from this same checkout at once; each sets this to its own run-scoped
  // subdirectory of the already-ignored .next/ so a later build never overwrites an
  // already-serving run's files. Absent, this is the ordinary shared .next/ every other build uses.
  // Known, accepted cost: Next nests its persistent build cache under distDir (distDir/cache), so
  // run-scoping it also gives every local-stack invocation a cold cache and a full production
  // build. Deliberately not worked around: the alternative (a stable, shared cache directory) means
  // concurrent local-stack runs would share writable build-cache state, the same class of hazard
  // this file scopes distDir to avoid in the first place. Weighed and accepted, not missed.
  distDir: process.env.OSE_ID_WEB_DIST_DIR ?? ".next",
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
