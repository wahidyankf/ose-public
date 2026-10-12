import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
  checkPathModelIntegrity,
  type PathModelContext,
} from "../../../../../src/features/course-paths/core/manifest-integrity";
import { normalizeCourseRef } from "../../../../../src/features/course-paths/core/manifest";
import { computeCore } from "../../../../../src/features/course-paths/core/path-core";
import { checkPrerequisiteConsistency } from "../../../../../src/features/course-paths/core/prerequisites";
import type { PrerequisitesByCourse } from "../../../../../src/features/course-paths/core/prerequisites";
import { PathManifestSchema, type PathManifest } from "../../../../../src/features/course-paths/core/schemas";

const appRoot = process.cwd();
const coursesRoot = path.join(appRoot, "content/en/learn/courses");
const manifestsRoot = path.join(appRoot, "src/features/course-paths/manifests");

export const REAL_MANIFEST_PATHS = [
  "careers/fundamentally-strong/software-engineer.json",
  "careers/immediately-effective/ai-engineer.json",
  "careers/immediately-effective/software-engineer.json",
  "careers/interview-ready/software-engineer.json",
  "skills/conventional-accounting.json",
  "skills/conventional-erp.json",
  "skills/sharia-accounting.json",
  "skills/sharia-erp.json",
] as const;

export interface RealManifestEntry {
  relativePath: string;
  manifest: PathManifest;
}

/** The 8 published manifests, parsed through the schema exactly as the site loads them. */
export function loadRealManifests(): RealManifestEntry[] {
  return REAL_MANIFEST_PATHS.map((relativePath) => ({
    relativePath,
    manifest: PathManifestSchema.parse(JSON.parse(fs.readFileSync(path.join(manifestsRoot, relativePath), "utf8"))),
  }));
}

export interface RealFrontmatter {
  prerequisitesByCourse: PrerequisitesByCourse;
  outlineCourseIds: ReadonlySet<string>;
  libraryCourseIds: readonly string[];
}

/** Real course frontmatter (`prerequisites`, `status`) read with gray-matter, never fixtures. */
export function loadRealFrontmatter(): RealFrontmatter {
  const slugs = fs
    .readdirSync(coursesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const dataBySlug = new Map(
    slugs.map((slug) => [slug, matter(fs.readFileSync(path.join(coursesRoot, slug, "_index.md"), "utf8")).data]),
  );
  return {
    prerequisitesByCourse: Object.fromEntries(
      slugs.map((slug) => [slug, (dataBySlug.get(slug)?.prerequisites as string[] | undefined) ?? []]),
    ),
    outlineCourseIds: new Set(slugs.filter((slug) => dataBySlug.get(slug)?.status === "outline")),
    libraryCourseIds: slugs,
  };
}

export function realPathModelContext(): { entries: RealManifestEntry[]; context: PathModelContext } {
  const entries = loadRealManifests();
  const frontmatter = loadRealFrontmatter();
  return {
    entries,
    context: {
      prerequisitesByCourse: frontmatter.prerequisitesByCourse,
      outlineCourseIds: frontmatter.outlineCourseIds,
      libraryCourseIds: frontmatter.libraryCourseIds,
    },
  };
}

/** Flattened course IDs of a manifest in path order. */
export function flattenedCourseIds(manifest: PathManifest): string[] {
  return manifest.courseOrder.map((ref) => normalizeCourseRef(ref).id);
}

describe("real manifests pass every path-model rule (plan 02 AC-3.1)", () => {
  const { entries, context } = realPathModelContext();

  for (const { relativePath, manifest } of entries) {
    it(`${manifest.pathId} reports zero path-model violations`, () => {
      const violations = checkPathModelIntegrity(manifest, context);
      const ordering = checkPrerequisiteConsistency(manifest, context.prerequisitesByCourse, context.libraryCourseIds);
      const detail = [
        `manifest: ${relativePath} (${manifest.pathId})`,
        `pathModel: ${JSON.stringify(violations)}`,
        `ordering: ${JSON.stringify(ordering.violations)}`,
        manifest.goals !== undefined
          ? `expectedCore: ${[...computeCore(manifest.goals, context.prerequisitesByCourse, manifest.assumes)].sort().join(", ")}`
          : "expectedCore: n/a (no goals)",
      ].join("\n");
      expect(ordering.violations, detail).toEqual([]);
      expect(violations.unresolvedIds, detail).toEqual([]);
      expect(violations.duplicateIds, detail).toEqual([]);
      expect(violations.duplicatePhaseIds, detail).toEqual([]);
      expect(violations.emptyPhaseIds, detail).toEqual([]);
      expect(violations.coreAfterExtension, detail).toEqual([]);
      expect(violations.closure, detail).toEqual([]);
      expect(violations.outlineInCore, detail).toEqual([]);
      expect(violations.goalsOutsideCore, detail).toEqual([]);
      expect(violations.coreMismatch, detail).toBeNull();
      expect(violations.unusedAssumes, detail).toEqual([]);
      expect(violations.assumesInsidePath, detail).toEqual([]);
      expect(violations.unresolvedAssumes, detail).toEqual([]);
      expect(violations.skillsExtension, detail).toEqual([]);
      expect(violations.markerNotAllowed, detail).toBe(false);
    });
  }
});
