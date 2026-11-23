import { describe, expect, it } from "vitest";
import {
  resolvePathsRoute,
  groupCareersManifestsByArc,
  skillsManifests,
  careersManifests,
  manifestsForArc,
  isLearnPathsSlug,
} from "../../../../../src/features/course-paths/shell/paths-route";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

function manifest(overrides: Pick<PathManifest, "pathId" | "arc">): PathManifest {
  return manifestFixture({ title: overrides.pathId, description: "desc", ...overrides });
}

describe("resolvePathsRoute", () => {
  it("resolves the bare 'learn/paths' slug to the hub", () => {
    expect(resolvePathsRoute("learn/paths", [])).toEqual({ kind: "hub" });
  });

  it("resolves a 1-segment known category to category-landing", () => {
    expect(resolvePathsRoute("learn/paths/careers", [])).toEqual({ kind: "category", category: "careers" });
    expect(resolvePathsRoute("learn/paths/skills", [])).toEqual({ kind: "category", category: "skills" });
  });

  it("resolves an unrecognized 1-segment category to not-found", () => {
    expect(resolvePathsRoute("learn/paths/bogus", [])).toEqual({ kind: "not-found" });
  });

  it("resolves a careers 2-segment slug matching no manifest to arc-landing", () => {
    expect(resolvePathsRoute("learn/paths/careers/interview-ready", [])).toEqual({
      kind: "arc",
      category: "careers",
      arc: "interview-ready",
    });
  });

  it("resolves a 2-segment skills slug matching a loaded manifest to path-landing", () => {
    const m = manifest({ pathId: "skills/example-subject", arc: "example-track" });
    expect(resolvePathsRoute("learn/paths/skills/example-subject", [m])).toEqual({ kind: "path", manifest: m });
  });

  it("resolves a 2-segment skills slug matching no manifest to not-found (no skills arc landing per R8)", () => {
    expect(resolvePathsRoute("learn/paths/skills/does-not-exist", [])).toEqual({ kind: "not-found" });
  });

  it("resolves a careers 3-segment slug matching a loaded manifest to path-landing", () => {
    const m = manifest({ pathId: "careers/interview-ready/example-role", arc: "interview-ready" });
    expect(resolvePathsRoute("learn/paths/careers/interview-ready/example-role", [m])).toEqual({
      kind: "path",
      manifest: m,
    });
  });

  it("resolves a careers 3-segment slug matching no manifest to not-found", () => {
    expect(resolvePathsRoute("learn/paths/careers/interview-ready/does-not-exist", [])).toEqual({
      kind: "not-found",
    });
  });

  it("resolves a slug outside the learn/paths namespace to not-found", () => {
    expect(resolvePathsRoute("learn/courses/just-enough-python", [])).toEqual({ kind: "not-found" });
  });
});

describe("groupCareersManifestsByArc", () => {
  it("groups careers manifests by arc, preserving first-seen arc order, and excludes skills manifests", () => {
    const a = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
    const b = manifest({ pathId: "careers/immediately-effective/role-b", arc: "immediately-effective" });
    const c = manifest({ pathId: "careers/immediately-effective/role-c", arc: "immediately-effective" });
    const skill = manifest({ pathId: "skills/subject", arc: "track" });

    expect(groupCareersManifestsByArc([a, b, c, skill])).toEqual([
      { arc: "interview-ready", manifests: [a] },
      { arc: "immediately-effective", manifests: [b, c] },
    ]);
  });
});

describe("skillsManifests", () => {
  it("returns only manifests whose pathId starts with skills/", () => {
    const careers = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
    const skill = manifest({ pathId: "skills/subject", arc: "track" });

    expect(skillsManifests([careers, skill])).toEqual([skill]);
  });
});

describe("careersManifests", () => {
  it("returns only manifests whose pathId starts with careers/, flat and in load order", () => {
    const a = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
    const b = manifest({ pathId: "careers/immediately-effective/role-b", arc: "immediately-effective" });
    const skill = manifest({ pathId: "skills/subject", arc: "track" });

    expect(careersManifests([skill, a, b])).toEqual([a, b]);
  });
});

describe("manifestsForArc", () => {
  it("returns only careers manifests for the named arc", () => {
    const a = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
    const b = manifest({ pathId: "careers/immediately-effective/role-b", arc: "immediately-effective" });

    expect(manifestsForArc([a, b], "interview-ready")).toEqual([a]);
  });
});

describe("isLearnPathsSlug", () => {
  it("is true for the bare prefix and any deeper slug under it", () => {
    expect(isLearnPathsSlug("learn/paths")).toBe(true);
    expect(isLearnPathsSlug("learn/paths/careers")).toBe(true);
    expect(isLearnPathsSlug("learn/paths/careers/interview-ready/example-role")).toBe(true);
  });

  it("is false for a slug outside the namespace, including a same-prefix sibling", () => {
    expect(isLearnPathsSlug("learn/courses/just-enough-python")).toBe(false);
    expect(isLearnPathsSlug("learn/paths-unrelated")).toBe(false);
  });
});
