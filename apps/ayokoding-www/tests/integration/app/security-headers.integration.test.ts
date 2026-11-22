import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// EWT-006 regression guard: the Content-Security-Policy must whitelist the Google Analytics
// origins so the intentionally-shipped GoogleAnalytics tag (src/app/layout.tsx, gaId
// G-1NHDR7S3GV via @next/third-parties/google) loads instead of being blocked with a console
// CSP-violation error on every page load. This is a content/string assertion over the Next.js
// config (the CSP value is a static string literal there); it fails if a future edit drops the
// GA origins from script-src / connect-src.
describe("ayokoding-www security headers — CSP allows Google Analytics (EWT-006)", () => {
  const configSource = readFileSync(join(__dirname, "..", "..", "..", "next.config.ts"), "utf8");

  const cspMatch = configSource.match(/"(default-src[^"]*?)"/);
  const csp = cspMatch?.[1] ?? "";

  it("declares a Content-Security-Policy with a default-src", () => {
    expect(csp).not.toBe("");
    expect(csp).toContain("default-src 'self'");
  });

  it("whitelists googletagmanager in script-src so the GA tag is not blocked", () => {
    const scriptSrc = csp.match(/script-src[^;]*/)?.[0] ?? "";
    expect(scriptSrc).toContain("googletagmanager.com");
  });

  it("whitelists the GA4 origins in connect-src for analytics beacons", () => {
    const connectSrc = csp.match(/connect-src[^;]*/)?.[0] ?? "";
    // GA4 (gtag.js) beacons reach *.google-analytics.com, *.analytics.google.com,
    // *.googletagmanager.com, and www.google.com (Google Signals) — all must be allowed.
    expect(connectSrc).toContain("google-analytics.com");
    expect(connectSrc).toContain("analytics.google.com");
    expect(connectSrc).toContain("googletagmanager.com");
    expect(connectSrc).toContain("https://www.google.com");
  });
});
