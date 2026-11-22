import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { checkManifestIntegrity } from "../../../../../../src/features/course-paths/core/manifest-integrity";
import { normalizeCourseRef } from "../../../../../../src/features/course-paths/core/manifest";
import { checkPrerequisiteConsistency } from "../../../../../../src/features/course-paths/core/prerequisites";
import { PathManifestSchema } from "../../../../../../src/features/course-paths/core/schemas";

const appRoot = process.cwd();
const coursesRoot = path.join(appRoot, "content/en/learn/courses");
const manifestFile = path.join(
  appRoot,
  "src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json",
);
const courseIds = fs
  .readdirSync(coursesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const prerequisitesByCourse = Object.fromEntries(
  courseIds.map((id) => [
    id,
    (matter(fs.readFileSync(path.join(coursesRoot, id, "_index.md"), "utf8")).data.prerequisites as
      | string[]
      | undefined) ?? [],
  ]),
);
const manifest = PathManifestSchema.parse(JSON.parse(fs.readFileSync(manifestFile, "utf8")));

describe("careers AI-engineer manifest", () => {
  it("resolves every syllabus course exactly once and preserves prerequisite ordering", () => {
    expect(checkManifestIntegrity(manifest, courseIds)).toEqual({ unresolvedIds: [], duplicateIds: [] });
    expect(checkPrerequisiteConsistency(manifest, prerequisitesByCourse, courseIds).violations).toEqual([]);
  });

  it("keeps evaluation before advanced AI-system delivery work", () => {
    // Order is read from `phases` (the file shape), not the derived `courseOrder`.
    const phaseCourseIds = manifest.phases.flatMap((phase) => phase.courses.map((ref) => normalizeCourseRef(ref).id));
    expect(phaseCourseIds.indexOf("evaluating-ai-output-essentials")).toBeLessThan(
      phaseCourseIds.indexOf("evaluating-ai-systems-in-depth"),
    );
    expect(phaseCourseIds.indexOf("evaluating-ai-systems-in-depth")).toBeLessThan(
      phaseCourseIds.indexOf("inference-serving-and-model-deployment"),
    );
  });
});
