import { existsSync } from "node:fs";
import { resolve } from "node:path";

// What the served site does for a request, read from the next.config.ts the site is built with and from the authored
// content tree, so integration scenarios exercise the real redirect and header rules without starting a server.

const contentDir = resolve(process.cwd(), "content");

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

export interface RedirectResponse {
  status: number;
  location: string;
}

export interface RedirectJourney {
  finalPath: string;
  hops: number;
  healthy: boolean;
}

async function loadNextConfig() {
  const { default: nextConfig } = await import("../../../../next.config");
  return nextConfig;
}

// The answer to a request for a path: the first rule of the assembled redirect list that matches, with Next.js's
// permanent status (308) or temporary status (307). Null means no redirect applies.
export async function redirectResponseFor(pathname: string): Promise<RedirectResponse | null> {
  const nextConfig = await loadNextConfig();
  const rules = ((await nextConfig.redirects?.()) ?? []) as RedirectRule[];
  for (const rule of rules) {
    const status = rule.permanent ? 308 : 307;
    if (!rule.source.endsWith("/:path*")) {
      if (pathname === rule.source) return { status, location: rule.destination };
      continue;
    }
    const sourceRoot = rule.source.slice(0, -"/:path*".length);
    if (pathname !== sourceRoot && !pathname.startsWith(`${sourceRoot}/`)) continue;
    const destinationRoot = rule.destination.slice(0, -"/:path*".length);
    return { status, location: `${destinationRoot}${pathname.slice(sourceRoot.length)}` };
  }
  return null;
}

// Follows redirects the way a browser does until a page is reached; a loop or an endless chain is unhealthy.
export async function followRedirects(pathname: string): Promise<RedirectJourney> {
  const seen = new Set([pathname]);
  let current = pathname;
  for (let hops = 0; hops < 8; hops += 1) {
    const response = await redirectResponseFor(current);
    if (response === null) return { finalPath: current, hops, healthy: true };
    if (seen.has(response.location)) return { finalPath: response.location, hops: hops + 1, healthy: false };
    current = response.location;
    seen.add(current);
  }
  return { finalPath: current, hops: 8, healthy: false };
}

// The authored content file a page URL is served from, or null when none exists.
export function contentFileFor(pageUrl: string): string | null {
  const relative = pageUrl.replace(/^\//u, "");
  const candidates = [resolve(contentDir, `${relative}.md`), resolve(contentDir, relative, "_index.md")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

// Turns a Next.js route source such as "/(.*)" or "/:locale(en|id)/:path*" into the pattern the router applies.
export function routeSourcePattern(source: string): RegExp {
  const pattern = source.replace(/:\w+\(([^)]*)\)/gu, "(?:$1)").replace("/:path*", "(?:/.*)?");
  return new RegExp(`^${pattern}$`, "u");
}

// The headers Next.js attaches to a path, keyed by lower-case header name.
export async function configuredHeadersFor(urlPath: string): Promise<Map<string, string>> {
  const nextConfig = await loadNextConfig();
  const rules = ((await nextConfig.headers?.()) ?? []) as HeaderRule[];
  const applicable = rules.filter((rule) => routeSourcePattern(rule.source).test(urlPath));
  return new Map(applicable.flatMap((rule) => rule.headers.map((header) => [header.key.toLowerCase(), header.value])));
}
