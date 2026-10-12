import { describe, expect, it } from "vitest";
import {
  checkPrerequisiteConsistency,
  resolvePrerequisites,
} from "../../../../../src/features/course-paths/core/prerequisites";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

const prerequisitesByCourse: Record<string, readonly string[]> = {
  "advanced-algorithms": ["data-structures-and-algorithms-essentials", "discrete-math-foundations"],
  "just-enough-python": [],
};

const libraryCourseIds: readonly string[] = [
  "just-enough-python",
  "data-structures-and-algorithms-essentials",
  "discrete-math-foundations",
  "advanced-algorithms",
];

// Clean: every in-manifest prerequisite of advanced-algorithms precedes it.
const cleanManifest: PathManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: ["data-structures-and-algorithms-essentials", "discrete-math-foundations", "advanced-algorithms"],
});

// Violating: advanced-algorithms precedes its declared prerequisite
// data-structures-and-algorithms-essentials. discrete-math-foundations is deliberately absent
// from this manifest so it can never count toward the violation total (only in-manifest
// prerequisites are checked) — keeping the violation count at exactly one.
// Link-don't-walk (OI-4): advanced-algorithms is included but its declared, in-library
// prerequisite discrete-math-foundations is omitted from the manifest entirely — permitted by
// design, never an ordering violation, only informational.
const omittedPrerequisiteManifest: PathManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: ["data-structures-and-algorithms-essentials", "advanced-algorithms"],
});

const violatingManifest: PathManifest = manifestFixture({
  pathId: "skills/algorithms",
  arc: "algorithms",
  title: "Algorithms",
  description: "Algorithms path",
  courses: ["advanced-algorithms", "data-structures-and-algorithms-essentials"],
});

describe("resolvePrerequisites", () => {
  it("returns both declared prerequisites in declaration order", () => {
    const result = resolvePrerequisites("advanced-algorithms", prerequisitesByCourse, libraryCourseIds);

    expect(result).toEqual(["data-structures-and-algorithms-essentials", "discrete-math-foundations"]);
  });

  it("returns an empty array for a course declaring no prerequisites", () => {
    const result = resolvePrerequisites("just-enough-python", prerequisitesByCourse, libraryCourseIds);

    expect(result).toEqual([]);
  });

  it("returns an empty array (not undefined, not a throw) for a course absent from the index", () => {
    const result = resolvePrerequisites("not-in-the-index", prerequisitesByCourse, libraryCourseIds);

    expect(result).toEqual([]);
    expect(result).not.toBeUndefined();
  });

  // RED (PR review finding #3, pr-review-synthesis-maker review 4770318960, cycle 2): pre-fix,
  // `resolvePrerequisites` took no `libraryCourseIds` param at all and returned every declared ID
  // unconditionally, resolvable or not — contradicting tech-docs.md rule 6 ("a referenced ID not
  // in the library is a resolver miss, not a crash: resolvePrerequisites returns only the IDs it
  // can resolve"). Falsifiable both ways: the in-library prerequisite must still be returned, so
  // an implementation that filters everything out fails the first assertion.
  it("filters out a declared prerequisite ID that does not resolve to a real library course (tech-docs.md rule 6)", () => {
    const prerequisitesWithADanglingId: Record<string, readonly string[]> = {
      "advanced-algorithms": ["data-structures-and-algorithms-essentials", "renamed-or-deleted-course"],
    };

    const result = resolvePrerequisites("advanced-algorithms", prerequisitesWithADanglingId, libraryCourseIds);

    expect(result).toEqual(["data-structures-and-algorithms-essentials"]);
    expect(result).not.toContain("renamed-or-deleted-course");
  });
});

describe("checkPrerequisiteConsistency", () => {
  it("reports zero violations for a manifest whose courseOrder respects every in-manifest prerequisite", () => {
    const result = checkPrerequisiteConsistency(cleanManifest, prerequisitesByCourse, libraryCourseIds);

    expect(result.violations).toEqual([]);
    expect(result.linkedPrerequisites).toEqual([]);
    expect(result.unresolvedPrerequisiteIds).toEqual([]);
  });

  it("reports zero violations and one linked prerequisite for a manifest that omits a declared, in-library prerequisite (OI-4)", () => {
    const result = checkPrerequisiteConsistency(omittedPrerequisiteManifest, prerequisitesByCourse, libraryCourseIds);

    expect(result.violations).toEqual([]);
    expect(result.linkedPrerequisites).toHaveLength(1);
    expect(result.linkedPrerequisites[0]).toEqual({
      courseId: "advanced-algorithms",
      missingPrerequisiteId: "discrete-math-foundations",
    });
    expect(result.unresolvedPrerequisiteIds).toEqual([]);
  });

  it("reports exactly one violation naming the course placed before its declared prerequisite", () => {
    const result = checkPrerequisiteConsistency(violatingManifest, prerequisitesByCourse, libraryCourseIds);

    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toEqual({
      courseId: "advanced-algorithms",
      missingPrerequisiteId: "data-structures-and-algorithms-essentials",
      courseIndex: 0,
      prerequisiteIndex: 1,
    });
    expect(result.unresolvedPrerequisiteIds).toEqual([]);
  });

  // RED (PR review finding #3, pr-review-synthesis-maker review 4770318960, cycle 2): pre-fix,
  // a prerequisite ID absent from `libraryCourseIds` was silently `continue`d past — reported
  // nowhere, contradicting tech-docs.md rule 6 ("checkPrerequisiteConsistency reports the rest").
  // Mirrors `checkManifestIntegrity.unresolvedIds`'s shape/naming (manifest-integrity.ts:18-25).
  // Falsifiable both ways: the clean fixture's zero violations/linkedPrerequisites must be
  // unaffected, and the unresolved ID must be reported exactly once even though two different
  // courses in the manifest both declare it.
  it("reports a declared prerequisite ID that does not resolve to a real library course as unresolvedPrerequisiteIds, deduplicated, never as a violation", () => {
    const danglingPrerequisitesByCourse: Record<string, readonly string[]> = {
      "data-structures-and-algorithms-essentials": ["renamed-or-deleted-course"],
      "advanced-algorithms": ["data-structures-and-algorithms-essentials", "renamed-or-deleted-course"],
    };

    const result = checkPrerequisiteConsistency(cleanManifest, danglingPrerequisitesByCourse, libraryCourseIds);

    expect(result.violations).toEqual([]);
    expect(result.linkedPrerequisites).toEqual([]);
    expect(result.unresolvedPrerequisiteIds).toEqual(["renamed-or-deleted-course"]);
  });

  // RED: `indexById` was built with `new Map(orderedIds.map((id, index) => [id, index]))`, which
  // keeps the LAST index for a duplicated course ID (a later entry overwrites an earlier one with
  // the same key). `just-enough-python` genuinely precedes `advanced-algorithms` at index 0, but
  // its duplicate re-listing at index 2 overwrote the index used for the lookup, producing a
  // false-positive ordering violation (2 > 1) for a manifest that is, in fact, correctly ordered.
  it("does not report a false-positive violation when a duplicated course ID's first (correctly-ordered) occurrence precedes the dependent course", () => {
    const duplicatePrerequisitesByCourse: Record<string, readonly string[]> = {
      "advanced-algorithms": ["just-enough-python"],
    };
    const duplicateManifest: PathManifest = manifestFixture({
      pathId: "skills/algorithms",
      arc: "algorithms",
      title: "Algorithms",
      description: "Algorithms path",
      courses: ["just-enough-python", "advanced-algorithms", "just-enough-python"],
    });

    const result = checkPrerequisiteConsistency(duplicateManifest, duplicatePrerequisitesByCourse, libraryCourseIds);

    expect(result.violations).toEqual([]);
  });
});
