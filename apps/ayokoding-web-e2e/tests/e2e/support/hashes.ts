// Shared-source hashing for the Playwright E2E adapter. The rewrite reads
// the Markdown corpus and course-path manifests in place; these helpers
// fingerprint them before and after browsing so the suite proves no test
// rewrote a developer's sources. Roots resolve from either the project
// directory or the workspace root, mirroring the server helper.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

function workspaceRoot(): string {
  const candidates = [path.resolve(process.cwd(), "..", ".."), process.cwd()];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "apps", "ayokoding-www", "content"))) return candidate;
  }
  return candidates[0] as string;
}

// sharedSourceRoots returns the read-only corpus roots the Go server can
// consume, the same pair the godog local-development steps hash.
export function sharedSourceRoots(): string[] {
  const root = workspaceRoot();
  return [
    path.join(root, "apps", "ayokoding-www", "content"),
    path.join(root, "apps", "ayokoding-www", "src", "features", "course-paths", "manifests"),
  ];
}

// hashSources fingerprints every file under the shared roots.
export function hashSources(): Record<string, string> {
  const hashes: Record<string, string> = {};
  const visit = (entry: string): void => {
    const info = statSync(entry, { throwIfNoEntry: false });
    if (info === undefined) return;
    if (info.isDirectory()) {
      for (const child of readdirSync(entry)) visit(path.join(entry, child));
      return;
    }
    if (info.isFile()) {
      hashes[entry] = createHash("sha256").update(readFileSync(entry)).digest("hex");
    }
  };
  for (const root of sharedSourceRoots()) visit(root);
  return hashes;
}
