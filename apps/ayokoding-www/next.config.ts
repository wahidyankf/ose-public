import "./src/env-loader.ts";
import "./src/env.ts";
import type { NextConfig } from "next";
import path from "node:path";
import { buildWorkerOptions } from "./src/build-workers";
import { learnReorgRedirects } from "./src/redirects/learn-reorg";
import { courseRehomeRedirects } from "./src/redirects/course-rehome";
import { contentNamespaceRedirects } from "./src/redirects/content-namespace";
import { learnThreeBucketRedirects } from "./src/redirects/learn-three-bucket";
import { localeEntryRedirects } from "./src/redirects/locale-entry";
import { contentCacheRule, TRPC_RUNTIME_TRACED_ASSETS } from "./src/features/content/core/static-delivery";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com;",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Redirect sources are case-sensitive. Without this explicit setting, Next
  // treats `/EN/:path*` as a match for canonical `/en/:path*`, creating a
  // permanent self-redirect loop. Keeping the finite locale rules below in
  // config preserves static redirects without restoring request-time proxying.
  experimental: {
    caseSensitiveRoutes: true,
    // Next treats a non-default `experimental.cpus` as a user override of its worker count, so
    // the cap applies to local builds only; CI and Vercel keep Next's default.
    ...buildWorkerOptions(process.env),
  },
  // Legacy markdown pages can exceed Next's 60s default during the full SSG
  // fan-out; retain static generation instead of retrying them as failures.
  staticPageGenerationTimeout: 180,
  poweredByHeader: false,
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/[locale]/[...slug]": ["./content/**/*", "./generated/**/*"],
    // tRPC serves navigation, search, and course-path data from the standalone
    // function at runtime. These are filesystem reads, so trace their assets
    // independently of the static content route.
    "/api/trpc/[trpc]": [...TRPC_RUNTIME_TRACED_ASSETS],
  },
  serverExternalPackages: ["flexsearch"],
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      contentCacheRule(),
    ];
  },
  async redirects() {
    // Order is load-bearing (DD-48, re-derived from first principles): contentNamespaceRedirects
    // FIRST so any stale /c/-prefixed request is stripped to its bare form before any other rule
    // evaluates — a rule positioned after it would never see a /c/-prefixed URL, since bare-only
    // rules can't match one. learnReorgRedirects next so historical within-/en/learn/ renames
    // resolve to their canonical domain. courseRehomeRedirects before the six-domain legacy-bucket
    // module last, so its more specific per-course rules win over the broader per-domain wildcard.
    return [
      ...localeEntryRedirects,
      ...contentNamespaceRedirects,
      ...learnReorgRedirects,
      ...courseRehomeRedirects,
      ...learnThreeBucketRedirects,
    ];
  },
};

export default nextConfig;
