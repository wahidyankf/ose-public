import fs from "node:fs/promises";
import path from "node:path";
import { PathManifestSchema, type PathManifest } from "../core/schemas";
import { checkManifestIntegrity } from "../core/manifest-integrity";
import { env } from "../../../env";

/**
 * The file-system port this adapter reads through. The default is the real `node:fs/promises`
 * adapter; unit tests pass an in-memory double, and the integration suite reads real manifest files.
 */
export interface ManifestFileSystem {
  readdir(dir: string): Promise<{ name: string; isDirectory(): boolean }[]>;
  readFile(filePath: string): Promise<string>;
}

export const nodeManifestFileSystem: ManifestFileSystem = {
  readdir: (dir) => fs.readdir(dir, { withFileTypes: true }),
  readFile: (filePath) => fs.readFile(filePath, "utf-8"),
};

/**
 * The manifests directory to glob, overridable via `AYOKODING_WEB_MANIFESTS_DIR` (mirrors
 * `AYOKODING_WEB_CONTENT_DIR` in `content/shell/repository-fs.ts`) so the e2e suite can point at a
 * fixture manifest set without touching the real, still-unpopulated `manifests/` directory.
 *
 * Reads `env` lazily (inside the function, not at module top level) — `@t3-oss/env-nextjs`'s
 * server-only guard throws when a server var is read in an environment that defines `window`
 * (jsdom-based unit tests included), so a top-level read would throw at import time for any test
 * merely importing this module, whether or not it calls this function.
 */
export function defaultManifestsDir(): string {
  return env.AYOKODING_WEB_MANIFESTS_DIR ?? path.resolve(process.cwd(), "src/features/course-paths/manifests");
}

/**
 * Load every path manifest under `manifestsDir` into a validated `PathManifest[]`.
 *
 * Walks `manifestsDir` recursively (variable-depth, R2 — `careers/<arc>/<role>.json` and
 * `skills/<subject>.json` both resolve through the same walk, with no depth-specific code path),
 * parses each `.json` file, and validates it through the upstream `PathManifestSchema` — **this
 * repository defines no validation of its own**: a manifest that would not load in production
 * cannot load in a test either. After schema validation, every `courseOrder` entry is checked
 * against `libraryCourseIds` via the upstream, pure `checkManifestIntegrity`.
 *
 * Per-file isolation (no batch-wide throw): `loadRoutePathData` calls this from the **root**
 * `[locale]` layout, which sits above the only `error.tsx` in the tree
 * (`app/[locale]/(content)/error.tsx`) — Next.js error boundaries cannot catch a throw from an
 * *ancestor* layout, so a throw here would 500 the entire site, not just the offending manifest's
 * page. A malformed manifest file (bad JSON, a `PathManifestSchema` violation, or an unresolvable
 * `courseOrder` reference) is therefore **skipped with a logged warning** rather than aborting the
 * whole batch — every other, valid manifest file still loads.
 *
 * Returns an empty array when `manifestsDir` does not exist yet (today's real state: the directory
 * is created by the upstream schema plan but populated only once a downstream manifests plan ships
 * real data) or contains no manifest files — never an error for the "no manifests yet" case.
 */
export async function loadManifests(
  manifestsDir: string,
  libraryCourseIds: readonly string[],
  io: ManifestFileSystem = nodeManifestFileSystem,
): Promise<PathManifest[]> {
  const files = await globManifestFiles(manifestsDir, io);
  const manifests: PathManifest[] = [];

  for (const filePath of files) {
    try {
      const raw = await io.readFile(filePath);
      const manifest = PathManifestSchema.parse(JSON.parse(raw));

      const integrity = checkManifestIntegrity(manifest, libraryCourseIds);
      if (integrity.unresolvedIds.length > 0) {
        throw new Error(
          `Manifest "${manifest.pathId}" (${filePath}) references unresolvable course ID(s): ` +
            integrity.unresolvedIds.join(", "),
        );
      }

      manifests.push(manifest);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[course-paths] Skipping malformed manifest file "${filePath}": ${message}`);
    }
  }

  return manifests;
}

/**
 * Recursively collect every `.json` manifest file under `dir`.
 *
 * Returns `[]` when `dir` does not exist — the real `manifests/` directory is created by the
 * upstream schema plan but is empty until a downstream manifests plan publishes real data, and
 * that "nothing to load yet" state is not an error.
 */
async function globManifestFiles(dir: string, io: ManifestFileSystem): Promise<string[]> {
  let entries: { name: string; isDirectory(): boolean }[];
  try {
    entries = await io.readdir(dir);
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await globManifestFiles(fullPath, io)));
    } else if (entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}
